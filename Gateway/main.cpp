#include <SPI.h>
#include <LoRa.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>
#include "dataPush.h"
#include <time.h>

// Pin definitions
#define SS_PIN 5
#define RST_PIN 4
#define DIO0_PIN 2
#define LED1 27

// Node configuration
const int NODE_ADDRESSES[] = {1, 2};
const int NUM_NODES = sizeof(NODE_ADDRESSES) / sizeof(NODE_ADDRESSES[0]);
bool nodeInitialized[NUM_NODES] = {false};
int currentNode = 0;
int check = 0;
bool thefirst = true;

// Time configuration
const char* ntpServer = "129.6.15.28";
const long gmtOffset_sec = 7 * 3600; // GMT+7 for Vietnam
struct tm timeinfo;
unsigned long lastNtpUpdate = 0;
const unsigned long ntpUpdateInterval = 3600000; // 1 hour

// Scheduling configuration
const int scheduledHour = 14, scheduledMinute = 40;
bool hasPolledToday = false;
const int scheduledPollCount = 3;

// RSSI monitoring
unsigned long lastRssiCheck = 0;
const unsigned long rssiCheckInterval = 1 * 60 * 1000; // 15 minutes

// Function prototypes
void initLoRa();
void initNTP();
void updateNTP();
void initializeNodes();
bool sendToNode(int nodeAddress, const String& message);
void pollNode(int nodeIndex);
void receiveAllDataFromNode(int nodeAddress);
void processNodeData(int nodeAddress, const String& data);
bool isScheduledTime();
void performScheduledPolling();
void checkAndRequestRSSI();
void requestRSSI(int nodeAddress);
void receiveRSSI(int nodeAddress);
void processRSSIData(int nodeAddress, const String& data);

void setup() {
    Serial.begin(115200);
    internetInit();
    Serial.println("Connected...yeey :)");

    initLoRa();
    initNTP();
    initializeNodes();
    
    Serial.println("Gateway setup completed!");
    Serial.printf("Scheduled polling: %02d:%02d, RSSI check: %d min\n", 
                  scheduledHour, scheduledMinute, rssiCheckInterval / 60000);
}

void loop() {
    // Periodic NTP update
    // if (millis() - lastNtpUpdate > ntpUpdateInterval) {
    //     updateNTP();
    //     lastNtpUpdate = millis();
    // }
    if(!getLocalTime(&timeinfo)){
        Serial.printf("Check . . ..");
        while(1);
    }
    // Scheduled polling check at 23h00
    if (isScheduledTime()) {
        performScheduledPolling();
    }
    
    // RSSI monitoring
    if (millis() - lastRssiCheck >= rssiCheckInterval) {
        checkAndRequestRSSI();
        lastRssiCheck = millis();
    }
    
    // Regular polling with rotation for test.
    // The first check
    while(thefirst){
    pollNode(currentNode);
    currentNode = (currentNode + 1) % NUM_NODES;
    check++;
    if(check == 2) {
    thefirst = false;
    Serial.println("The first check is done !!!");
    break;}
    } 
}

void initLoRa() {
    LoRa.setPins(SS_PIN, RST_PIN, DIO0_PIN);
    if (!LoRa.begin(433E6)) {
        Serial.println("LoRa initialization failed!");
        return;
    }
    LoRa.setSyncWord(0xF3);
    Serial.println("LoRa initialized successfully!");
}

void initNTP() {
    Serial.println("Initializing NTP...");
    configTime(gmtOffset_sec, 0, ntpServer);
    
    for (int attempts = 0; attempts < 10; attempts++) {
        if (getLocalTime(&timeinfo)) {
            Serial.printf("NTP synchronized: %04d-%02d-%02d %02d:%02d:%02d\n",
                         timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
                         timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
            return;
        }
        Serial.println("Retrying NTP sync...");
        delay(1000);
    }
    Serial.println("NTP sync failed!");
}

void updateNTP() {
    configTime(gmtOffset_sec, 0, ntpServer);
    if (getLocalTime(&timeinfo)) {
        Serial.printf("NTP updated: %02d:%02d:%02d\n", 
                     timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    }
}

bool isScheduledTime() {
    if (!getLocalTime(&timeinfo)) return false;
    
    // Reset daily flag at midnight
    if (timeinfo.tm_hour == 0 && timeinfo.tm_min == 0) {
        hasPolledToday = false;
    }
    
    return (timeinfo.tm_hour == scheduledHour && 
            timeinfo.tm_min == scheduledMinute && 
            !hasPolledToday);
}

void performScheduledPolling() {
    Serial.printf("\n=== SCHEDULED POLLING (%02d:%02d) ===\n", 
                  timeinfo.tm_hour, timeinfo.tm_min);
    
    for (int cycle = 1; cycle <= scheduledPollCount; cycle++) {
        Serial.printf("Cycle %d/%d\n", cycle, scheduledPollCount);

        for(int i = 0; i < 2; i++){
        pollNode(currentNode);
        currentNode = (currentNode + 1) % NUM_NODES;
        }
        
        if (cycle < scheduledPollCount) delay(3000);
    }
    
    hasPolledToday = true;
    Serial.println("=== SCHEDULED POLLING COMPLETED ===\n");
}

void checkAndRequestRSSI() {
    Serial.println("\n=== RSSI CHECK ===");
    if (getLocalTime(&timeinfo)) {
        Serial.printf("Time: %02d:%02d:%02d\n", timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    }
    
    for (int i = 0; i < NUM_NODES; i++) {
        if (nodeInitialized[i]) {
            requestRSSI(NODE_ADDRESSES[i]);
            delay(2000);
        }
    }
    Serial.println("=== RSSI CHECK COMPLETED ===\n");
}

void requestRSSI(int nodeAddress) {
    if (sendToNode(nodeAddress, "getRSSI")) {
        receiveRSSI(nodeAddress);
    }
}

void receiveRSSI(int nodeAddress) {
    unsigned long startTime = millis();
    
    while (millis() - startTime < 5000) {
        int packetSize = LoRa.parsePacket();
        if (packetSize > 0) {
            byte sender = LoRa.read();
            byte receiver = LoRa.read();

            if (sender == nodeAddress && receiver == 10) {
                String response = "";
                while (LoRa.available()) {
                    response += (char)LoRa.read();
                }
                processRSSIData(nodeAddress, response);
                return;
            }
            // Skip wrong packets
            while (LoRa.available()) LoRa.read();
        }
    }
    Serial.printf("RSSI timeout for Node %d\n", nodeAddress);
}

void processRSSIData(int nodeAddress, const String& data) {
    Serial.printf("Raw RSSI data from Node %d: %s\n", nodeAddress, data.c_str());

    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, data);

    if (error) {
        Serial.printf("RSSI JSON parse error for Node %d: %s\n", nodeAddress, error.c_str());
        return;
    }

    // An toàn để truy cập doc sau khi kiểm tra thành công
    int rssi = doc["rssi"] | 0;
    String status = doc["status"] | "unknown";

    Serial.printf("Node %d - Status: %s, RSSI: %d dBm\n", nodeAddress, status.c_str(), rssi);

    // Push RSSI lên server
    PushRssi("node_" + String(nodeAddress),rssi);
}

void initializeNodes() {
    Serial.println("Initializing nodes...");
    
    for (int i = 0; i < NUM_NODES; i++) {
        Serial.printf("Node %d: ", i + 1);
        
        for (int retry = 0; retry < 3 && !nodeInitialized[i]; retry++) {
            if (sendToNode(NODE_ADDRESSES[i], "Hi")) {
                unsigned long startTime = millis();
                
                while (millis() - startTime < 3000) {
                    int packetSize = LoRa.parsePacket();
                    if (packetSize > 0) {
                        byte sender = LoRa.read();
                        byte receiver = LoRa.read();

                        if (sender == NODE_ADDRESSES[i] && receiver == 10) {
                            String response = "";
                            while (LoRa.available()) {
                                response += (char)LoRa.read();
                            }
                            
                            if (response == "Done" ) {
                                nodeInitialized[i] = true;
                                Serial.println("OK");
                            }
                        } else {
                            while (LoRa.available()) LoRa.read();
                        }
                    }
                }
            }
            if (!nodeInitialized[i]) delay(500);
        }
        
        if (!nodeInitialized[i]) {
            Serial.println("FAILED");
        }
    }
}

bool sendToNode(int nodeAddress, const String& message) {
    LoRa.beginPacket();
    LoRa.write(nodeAddress);
    LoRa.write(10);  // Gateway address
    LoRa.print(message);
    return LoRa.endPacket();
}

void pollNode(int nodeIndex) {
    if (!nodeInitialized[nodeIndex]) return;
    
    Serial.printf("\n=== Polling Node %d ===\n", nodeIndex + 1);
    
    // Create and send getData command
    JsonDocument doc;
    doc["command"] = "getData" + String(nodeIndex + 1);
    doc["nodeId"] = nodeIndex + 1;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    if (sendToNode(NODE_ADDRESSES[nodeIndex], jsonString)) {
        receiveAllDataFromNode(NODE_ADDRESSES[nodeIndex]);
    } else {
        Serial.printf("Failed to send command to Node %d\n", nodeIndex + 1);
    }
}

void receiveAllDataFromNode(int nodeAddress) {
    unsigned long startTime = millis();
    int dataPacketCount = 0;

    while (millis() - startTime < 10000) {
        int packetSize = LoRa.parsePacket();
        if (packetSize > 0) {
            byte sender = LoRa.read();
            byte receiver = LoRa.read();

            if (sender == nodeAddress && receiver == 10) {
                String response = "";
                while (LoRa.available()) {
                    response += (char)LoRa.read();
                }

                if (response == "end") {
                    Serial.printf("Received %d data packets from Node %d\n", dataPacketCount, nodeAddress);
                    break;
                } else {
                    processNodeData(nodeAddress, response);
                    dataPacketCount++;
                    sendToNode(nodeAddress, "ok" + String(nodeAddress));
                    startTime = millis(); // Reset timeout
                }
            } else {
                while (LoRa.available()) LoRa.read();
            }
        }
    }
}

void processNodeData(int nodeAddress, const String& data) {
    JsonDocument doc;
    if (deserializeJson(doc, data) != DeserializationError::Ok) {
        Serial.printf("JSON parse error for Node %d\n", nodeAddress);
        return;
    }

    String sensorId = doc["sensorId"];
    String nodeId = "node_" + String(nodeAddress);
    
    if (nodeAddress == 1) {
        float water = doc["Water"] | 0.0f;
        PusherW(nodeId, sensorId, water);
        Serial.printf("Water data pushed: Node %d, Sensor %s, Value %.2fl\n\n", 
                     nodeAddress, sensorId.c_str(), water);
    } else if (nodeAddress == 2) {
        float power = doc["Power"] | 0.0f;
        float voltage = doc["Voltage"] | 0.0f;
        PusherE(nodeId, sensorId, power, voltage);
        Serial.printf("Energy data pushed: Node %d, Sensor %s, P=%.2f, V=%.2f\n\n", 
                     nodeAddress, sensorId.c_str(), power, voltage);
    }
}