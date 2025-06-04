#include "FS300A.h"
#include <EEPROM.h>

// Cấu hình EEPROM addresses
#define WATER1_EEPROM_ADDR 0    // 4 bytes cho water1 total
#define WATER2_EEPROM_ADDR 4    // 4 bytes cho water2 total

// Biến cho cảm biến 1
volatile unsigned long pulseCount1 = 0;
unsigned long lastTime1 = 0;
float water1_temp = 0.0;        // Lượng nước tạm thời (từ lần gửi cuối)
float water1_eeprom = 0.0;      // Chỉ số tích lũy từ EEPROM
float water1_total = 0.0;       // Tổng = EEPROM + temp

// Biến cho cảm biến 2
volatile unsigned long pulseCount2 = 0;
unsigned long lastTime2 = 0;
float water2_temp = 0.0;        // Lượng nước tạm thời (từ lần gửi cuối)
float water2_eeprom = 0.0;      // Chỉ số tích lũy từ EEPROM  
float water2_total = 0.0;       // Tổng = EEPROM + temp

// Hàm ngắt cho cảm biến 1
void IRAM_ATTR pulseCounter1() {
    pulseCount1++;
}

// Hàm ngắt cho cảm biến 2
void IRAM_ATTR pulseCounter2() {
    pulseCount2++;
}

// Hàm đọc float từ EEPROM
float readFloatFromEEPROM(int address) {
    float value;
    EEPROM.get(address, value);
    if (isnan(value) || value < 0) {
        value = 0;  // Giá trị mặc định nếu chưa có dữ liệu
    }
    return value;
}

// Hàm ghi float vào EEPROM
void writeFloatToEEPROM(int address, float value) {
    EEPROM.put(address, value);
    EEPROM.commit();
}

// Tác vụ (Task) xử lý cảm biến
void sensorTask(void *pvParameters) {
    while (1) {
        unsigned long currentTime = millis();
        
        // Xử lý cảm biến 1
        if (currentTime - lastTime1 >= 1000) {  // Cập nhật mỗi giây
            unsigned long count1 = pulseCount1;
            pulseCount1 = 0;  // Reset số xung
            
            // Cộng vào biến tạm
            water1_temp += (count1 * ML_PER_PULSE) / 1000.0;  // Chuyển ml sang lít
            
            lastTime1 = currentTime;
            Serial.print("Water 1 temp: ");
            Serial.print(water1_temp); 
            Serial.print(" L, Total: ");
            Serial.print(water1_eeprom + water1_temp);
            Serial.println(" L");
        }
        
        // Xử lý cảm biến 2
        if (currentTime - lastTime2 >= 1000) {  // Cập nhật mỗi giây
            unsigned long count2 = pulseCount2;
            pulseCount2 = 0;  // Reset số xung
            
            // Cộng vào biến tạm
            water2_temp += (count2 * ML_PER_PULSE) / 1000.0;  // Chuyển ml sang lít
            
            lastTime2 = currentTime;
            Serial.print("Water 2 temp: ");
            Serial.print(water2_temp); 
            Serial.print(" L, Total: ");
            Serial.print(water2_eeprom + water2_temp);
            Serial.println(" L");
        }
        
        vTaskDelay(10 / portTICK_PERIOD_MS);  // Giảm tải CPU
    }
}

void FS300A_Init() {
    // Cấu hình chân với pull-up
    pinMode(FS300A_PIN1, INPUT_PULLUP);
    pinMode(FS300A_PIN2, INPUT_PULLUP);

    // Gắn ngắt cho từng cảm biến
    attachInterrupt(digitalPinToInterrupt(FS300A_PIN1), pulseCounter1, FALLING);
    attachInterrupt(digitalPinToInterrupt(FS300A_PIN2), pulseCounter2, FALLING);

    // Đọc giá trị tích lũy từ EEPROM
    water1_eeprom = readFloatFromEEPROM(WATER1_EEPROM_ADDR);
    water2_eeprom = readFloatFromEEPROM(WATER2_EEPROM_ADDR);
    
    Serial.print("Restored Water1 EEPROM: ");
    Serial.print(water1_eeprom);
    Serial.println(" L");
    Serial.print("Restored Water2 EEPROM: ");
    Serial.print(water2_eeprom);
    Serial.println(" L");

    // Khởi tạo thời gian
    lastTime1 = millis();
    lastTime2 = millis();
}

void FS300A_StartTask() {
    // Tạo tác vụ cảm biến với stack size 2048 và mức ưu tiên 1
    xTaskCreate(sensorTask, "SensorTask", 2048, NULL, 1, NULL);
}

// Hàm cập nhật total values trước khi gửi
void updateWaterTotals() {
    water1_total = water1_eeprom + water1_temp;
    water2_total = water2_eeprom + water2_temp;
    
    Serial.print("Updated totals - Water1: ");
    Serial.print(water1_total);
    Serial.print(" L, Water2: ");
    Serial.print(water2_total);
    Serial.println(" L");
}

// Hàm commit temp values vào EEPROM sau khi gửi thành công
void commitWaterValues() {
    // Cập nhật EEPROM với giá trị mới
    water1_eeprom += water1_temp;
    water2_eeprom += water2_temp;
    
    // Lưu vào EEPROM
    writeFloatToEEPROM(WATER1_EEPROM_ADDR, water1_eeprom);
    writeFloatToEEPROM(WATER2_EEPROM_ADDR, water2_eeprom);
    
    Serial.print("Committed to EEPROM - Water1: ");
    Serial.print(water1_eeprom);
    Serial.print(" L, Water2: ");
    Serial.print(water2_eeprom);
    Serial.println(" L");
    
    // Reset temp values
    water1_temp = 0.0;
    water2_temp = 0.0;
    
    Serial.println("Reset temp values to 0");
}