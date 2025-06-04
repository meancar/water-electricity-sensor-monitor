#include <LoRa.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <EEPROM.h>

#define EEPROM_SIZE 64
#define ENERGY_POWER1_ADDR 0    // 4 bytes cho power1 accumulated energy
#define ENERGY_POWER2_ADDR 4    // 4 bytes cho power2 accumulated energy

// Biến cho power1
float power1_temp_energy = 0.0;      // Điện năng tạm thời (từ lần gửi cuối)
float power1_eeprom_energy = 0.0;    // Điện năng tích lũy từ EEPROM
float power1_total_energy = 0.0;     // Tổng = EEPROM + temp

// Biến cho power2
float power2_temp_energy = 0.0;      // Điện năng tạm thời (từ lần gửi cuối)
float power2_eeprom_energy = 0.0;    // Điện năng tích lũy từ EEPROM
float power2_total_energy = 0.0;     // Tổng = EEPROM + temp

PZEM004Tv30 pzem(Serial2, 16, 17);

#define SIG_PIN 34
#define S3 32
#define S2 33
#define S1 25
#define S0 26

#define SS_PIN    5
#define RST_PIN   4
#define DIO0_PIN  2

const int NODE_ADDRESS = 2;
const int GATEWAY_ADDRESS = 10;

// Định nghĩa kênh cảm biến
const uint8_t SENSOR_CHANNELS[2] = {0, 1};  // MUX channel 0 và 1
const char* SENSOR_IDS[2] = {"power1", "power2"};

// Trạng thái gửi dữ liệu
enum DataSendState {
    IDLE,
    SENT_POWER1,
    SENT_POWER2,
    COMPLETED
};

DataSendState currentState = IDLE;

void initLoRa();
void handleInitialization(String message);
void handleCommand(String message);
void handleOkCommand();
bool sendToGateway(String message);
void processReceivedMessage(int senderAddr, String message);
void receiveMessage();
void selectMuxChannel(uint8_t channel);
String readSensorData(const char* sensorId, uint8_t channel);
void initEEPROM();
void saveEnergyToEEPROM(int address, float energy);
float readEnergyFromEEPROM(int address);
void updateEnergyTotals();
void commitEnergyValues();
void handleGetDataCommand();
void handleOkCommand();
void handleGetRSSICommand();

void setup() {
    Serial.begin(115200);
    pinMode(S0, OUTPUT);
    pinMode(S1, OUTPUT);
    pinMode(S2, OUTPUT);
    pinMode(S3, OUTPUT);
    
    initEEPROM();
    initLoRa();
    Serial.println("Node 2 Setup completed");
}

void loop() {
    receiveMessage();

}

void selectMuxChannel(uint8_t channel) {
    digitalWrite(S0, bitRead(channel, 0));
    digitalWrite(S1, bitRead(channel, 1));
    digitalWrite(S2, bitRead(channel, 2));
    digitalWrite(S3, bitRead(channel, 3));
    delay(200); // Đợi MUX ổn định
}

void initLoRa() {
    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);
    if (!LoRa.begin(433E6)) {
        Serial.println("LoRa initialization failed!");
        while(1);
    }
    LoRa.setSyncWord(0xF3);
    Serial.println("Node 2 LoRa initialized!");
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
    else if (message == "ok2") {  // Gateway gửi "ok2" cho Node 2
        handleOkCommand();
    } else {
        handleCommand(message);
    }
}

void handleInitialization(String message) {
    Serial.println("Received initialization message from Gateway");
    delay(random(100, 500)); // Random delay để tránh collision
    sendToGateway("Done");
    Serial.println("Sent Done response");
}

void handleCommand(String message) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, message);
    
    if (error) {
        Serial.printf("JSON parse error: %s\n", error.c_str());
        return;
    }
    
    String command = doc["command"].as<String>();
    
    if (command == "getData2") {
        Serial.println("Received getData2 command from Gateway");
        handleGetDataCommand();
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


void handleGetDataCommand() {
    // Reset state machine
    currentState = IDLE;
    
    // Cập nhật total values trước khi gửi
    updateEnergyTotals();
    
    // Gửi data của power1 (sensor đầu tiên)
    Serial.println("Sending power1 data...");
    String sensorData = readSensorData(SENSOR_IDS[0], SENSOR_CHANNELS[0]);
    if (sendToGateway(sensorData)) {
        Serial.println("Sent power1 data successfully");
        currentState = SENT_POWER1;
    } else {
        Serial.println("Failed to send power1 data");
        currentState = IDLE;
    }
}

void handleOkCommand() {
    Serial.println("Received 'ok2' from Gateway");
    
    switch (currentState) {
        case SENT_POWER1:
            // Gửi dữ liệu power2
            {
                Serial.println("Sending power2 data...");
                String sensorData = readSensorData(SENSOR_IDS[1], SENSOR_CHANNELS[1]);
                if (sendToGateway(sensorData)) {
                    Serial.println("Sent power2 data successfully");
                    currentState = SENT_POWER2;
                } else {
                    Serial.println("Failed to send power2 data");
                    currentState = IDLE;
                }
            }
            break;
            
        case SENT_POWER2:
            // Gửi end signal
            if (sendToGateway("end")) {
                Serial.println("Sent end signal successfully");
                
                // Commit temp values vào EEPROM sau khi gửi thành công
                commitEnergyValues();
                Serial.println("Data transmission completed and energy values committed");
                
                currentState = COMPLETED;
            } else {
                Serial.println("Failed to send end signal");
            }
            break;
            
        default:
            Serial.println("Received unexpected ok2 command");
            break;
    }
}

String readSensorData(const char* sensorId, uint8_t channel) {
    selectMuxChannel(channel);
    
    Serial.printf("Reading data from sensor %s on channel %d\n", sensorId, channel);

    // Đọc dữ liệu từ PZEM
    float currentEnergy = pzem.energy();
    Serial.printf("Sensor %d has: %d kWh",channel+1,currentEnergy);
    float voltage = pzem.voltage();
    float power = pzem.power();
    
    float totalEnergy = 0.0;
    
    // Xử lý điện năng theo sensor
    if (channel == 0) {
        if (!isnan(currentEnergy) && currentEnergy > 0) {
            // Cộng vào biến temp
            power1_temp_energy += currentEnergy;
            Serial.printf("Power1 temp energy: %.3f kWh (added %.3f kWh)\n", power1_temp_energy, currentEnergy);
            
            // Reset PZEM để đo lại từ đầu
            Serial.println("Resetting PZEM energy counter...");
            pzem.resetEnergy();
        }
        totalEnergy = power1_total_energy;
        
    } else if (channel == 1) {
        if (!isnan(currentEnergy) && currentEnergy > 0) {
            // Cộng vào biến temp
            power2_temp_energy += currentEnergy;
            Serial.printf("Power2 temp energy: %.3f kWh (added %.3f kWh)\n", power2_temp_energy, currentEnergy);
            
            // Reset PZEM để đo lại từ đầu
            Serial.println("Resetting PZEM energy counter...");
            pzem.resetEnergy();
        }
        totalEnergy = power2_total_energy;
    }

    // Tạo JSON packet
    JsonDocument doc;
    doc["nodeId"] = NODE_ADDRESS;
    doc["sensorId"] = sensorId;
    doc["Power"] = totalEnergy;                         // Bị nhầm cách đặt tên biến
    doc["Voltage"] = isnan(voltage) ? 0.0 : voltage;     // Điện áp

    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.printf("Sensor data: %s\n", jsonString.c_str());
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

// Khởi tạo EEPROM
void initEEPROM() {
    EEPROM.begin(EEPROM_SIZE);
    
    // Đọc giá trị điện năng tích lũy từ EEPROM
    power1_eeprom_energy = readEnergyFromEEPROM(ENERGY_POWER1_ADDR);
    power2_eeprom_energy = readEnergyFromEEPROM(ENERGY_POWER2_ADDR);
    Serial.print("Restored Power1 EEPROM: ");
    Serial.print(power1_eeprom_energy);
    Serial.println(" kWh");
    Serial.print("Restored Power2 EEPROM: ");
    Serial.print(power2_eeprom_energy);
    Serial.println(" kWh");
}

// Lưu điện năng vào EEPROM
void saveEnergyToEEPROM(int address, float energy) {
    EEPROM.put(address, energy);
    EEPROM.commit();
    Serial.printf("Saved energy to EEPROM address %d: %.3f kWh\n", address, energy);
}

// Đọc điện năng từ EEPROM
float readEnergyFromEEPROM(int address) {
    float energy;
    EEPROM.get(address, energy);
    
    // Kiểm tra nếu giá trị không hợp lệ (EEPROM trống hoặc bị lỗi)
    if (isnan(energy) || energy < 0) {
        energy = 1000;
        saveEnergyToEEPROM(address, energy); // Lưu giá trị mặc định
    }
    
    return energy;
}

// Hàm cập nhật total values trước khi gửi
void updateEnergyTotals() {
    power1_total_energy = power1_eeprom_energy + power1_temp_energy;
    power2_total_energy = power2_eeprom_energy + power2_temp_energy;
    
    Serial.print("Updated totals - Power1: ");
    Serial.print(power1_total_energy);
    Serial.print(" kWh, Power2: ");
    Serial.print(power2_total_energy);
    Serial.println(" kWh");
}

// Hàm commit temp values vào EEPROM sau khi gửi thành công
void commitEnergyValues() {
    // Cập nhật EEPROM với giá trị mới
    power1_eeprom_energy += power1_temp_energy;
    power2_eeprom_energy += power2_temp_energy;
    
    // Lưu vào EEPROM
    saveEnergyToEEPROM(ENERGY_POWER1_ADDR, power1_eeprom_energy);
    saveEnergyToEEPROM(ENERGY_POWER2_ADDR, power2_eeprom_energy);
    
    Serial.print("Committed to EEPROM - Power1: ");
    Serial.print(power1_eeprom_energy);
    Serial.print(" kWh, Power2: ");
    Serial.print(power2_eeprom_energy);
    Serial.println(" kWh");
    
    // Reset temp values
    power1_temp_energy = 0.0;
    power2_temp_energy = 0.0;
    
    Serial.println("Reset temp energy values to 0");
}