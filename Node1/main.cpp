#include <Arduino.h>
#include "FS300A.h"
#include <LoRa.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Cấu hình LoRa
#define SS_PIN    5
#define RST_PIN   4
#define DIO0_PIN  2

// Cấu hình EEPROM
#define EEPROM_SIZE 64

const int NODE_ADDRESS = 1;
const int GATEWAY_ADDRESS = 10;

// Trạng thái gửi dữ liệu
enum DataSendState {
    IDLE,
    SENT_WATER1,
    SENT_WATER2,
    COMPLETED
};

DataSendState currentState = IDLE;

void initLoRa();
void receiveMessage();
void processReceivedMessage(int senderAddr, String message);
void handleInitialization(String message);
void handleCommand(String message);
bool sendToGateway(String message);
String createSensorPacket(const char* sensorId, float value);
void handleOkCommand();
void handleGetDataCommand();
void handleGetRSSICommand();

void setup() {
    Serial.begin(115200);
    
    // Khởi tạo EEPROM
    EEPROM.begin(EEPROM_SIZE);
    
    // Khởi tạo FS300A (sẽ đọc giá trị từ EEPROM)
    FS300A_Init();
    FS300A_StartTask();

    initLoRa();
    Serial.println("Node 1 Setup completed");
}

void loop() {
    receiveMessage();
}

// ---------------- LoRa ------------------

void initLoRa() {
    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);
    if (!LoRa.begin(433E6)) {
        Serial.println("LoRa initialization failed!");
        while(1);
    }
    LoRa.setSyncWord(0xF3);
    Serial.println("Node 1 Lora initialized!");
}

void receiveMessage() {
    int packetSize = LoRa.parsePacket();
    if (packetSize) {
        int targetAddr = LoRa.read();
        int senderAddr = LoRa.read();
        
        // Kiểm tra đúng địa chỉ target và sender
        if (targetAddr == NODE_ADDRESS && senderAddr == GATEWAY_ADDRESS) {
            String message = "";
            while (LoRa.available()) {
                message += (char)LoRa.read();
            }
            Serial.printf("Received from Gateway: %s\n", message.c_str());
            processReceivedMessage(senderAddr, message);
        } else {
            // Clear buffer nếu không phải message dành cho node này
            while (LoRa.available()) {
                LoRa.read();
            }
        }
    }
}

void processReceivedMessage(int senderAddr, String message) {
    if (message == "Hi") {
        handleInitialization(message);
    }else if(message == "getRSSI"){
    Serial.println("Received getRSSI command from Gateway");
    handleGetRSSICommand();
    }
     else {
        handleCommand(message);
    }
}

void handleInitialization(String message) {
    Serial.println("Received initialization message");
    delay(random(100, 500)); // Random delay để tránh collision
    sendToGateway("Done");
    Serial.println("Sent Done response");
}

void handleCommand(String message) {
    // Kiểm tra nếu là lệnh "ok1" (không phải JSON)
    if (message == "ok1") {
        Serial.println("Received ok1 from Gateway");
        handleOkCommand();
        return;
    }
    
    // Xử lý JSON command
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
        Serial.printf("JSON parse error: %s\n", error.c_str());
        return;
    }
    
    String command = doc["command"].as<String>();
    
    if (command == "getData1") {
        Serial.println("Received getData1 command from Gateway");
        handleGetDataCommand();
    }
}

void handleGetDataCommand() {
    // Reset state machine
    currentState = IDLE;
    
    // Cập nhật total values trước khi gửi
    updateWaterTotals();
    
    // Gửi dữ liệu water1 đầu tiên
    String sensorData = createSensorPacket("water1", water1_total);
    if (sendToGateway(sensorData)) {
        Serial.println("Sent water1 data successfully");
        currentState = SENT_WATER1;
    } else {
        Serial.println("Failed to send water1 data");
        currentState = IDLE;
    }
}

void handleGetRSSICommand() {
    int rssi = LoRa.packetRssi();  // RSSI của gói tin gần nhất từ Gateway

    JsonDocument doc;
    doc["nodeId"] = NODE_ADDRESS;
    doc["status"] = "online";
    doc["rssi"] = rssi;

    String jsonString;
    serializeJson(doc, jsonString);

    Serial.printf("Sending RSSI response: %s\n", jsonString.c_str());
    sendToGateway(jsonString);
}

void handleOkCommand() {
    switch (currentState) {
        case SENT_WATER1:
            // Gửi dữ liệu water2
            {
                String sensorData = createSensorPacket("water2", water2_total);
                if (sendToGateway(sensorData)) {
                    Serial.println("Sent water2 data successfully");
                    currentState = SENT_WATER2;
                } else {
                    Serial.println("Failed to send water2 data");
                    currentState = IDLE;
                }
            }
            break;
            
        case SENT_WATER2:
            // Gửi end signal
            if (sendToGateway("end")) {
                Serial.println("Sent end signal successfully");
                
                // Commit temp values vào EEPROM sau khi gửi thành công
                commitWaterValues();
                Serial.println("Data transmission completed and values committed");
                
                currentState = COMPLETED;
            } else {
                Serial.println("Failed to send end signal");
            }
            break;
            
        default:
            Serial.println("Received unexpected ok1 command");
            break;
    }
}

String createSensorPacket(const char* sensorId, float value) {
    JsonDocument doc;
    doc["nodeId"] = NODE_ADDRESS;
    doc["sensorId"] = sensorId;
    doc["Water"] = value;  // Thay đổi từ "Value" thành "Water" để khớp với Gateway

    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

bool sendToGateway(String message) {
    delay(random(100, 500)); // Random delay để tránh collision
    
    Serial.printf("Sending to Gateway: %s\n", message.c_str());
    
    LoRa.beginPacket();
    LoRa.write(NODE_ADDRESS);      // Sender address
    LoRa.write(GATEWAY_ADDRESS);   // Receiver address  
    LoRa.print(message);
    
    bool success = LoRa.endPacket();
    
    if (success) {
        Serial.println("Message sent successfully");
    } else {
        Serial.println("Failed to send message");
    }
    
    return success;
}