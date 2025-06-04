#ifndef FS300A_H
#define FS300A_H

#include <Arduino.h>

// Định nghĩa chân cho hai cảm biến FS300A
#define FS300A_PIN1 34  // Chân cho cảm biến 1
#define FS300A_PIN2 32  // Chân cho cảm biến 2
#define ML_PER_PULSE 5.5  // Giá trị thể tích trên mỗi xung (ml)

// Khai báo các biến toàn cục
extern float water1_temp;      // Lượng nước tạm thời từ cảm biến 1 (từ lần gửi cuối)
extern float water2_temp;      // Lượng nước tạm thời từ cảm biến 2 (từ lần gửi cuối)

extern float water1_total;     // Tổng lượng nước cảm biến 1 (EEPROM + temp)
extern float water2_total;     // Tổng lượng nước cảm biến 2 (EEPROM + temp)

// Hàm khởi tạo module cảm biến
void FS300A_Init();

// Hàm tạo tác vụ (task) cho cảm biến
void FS300A_StartTask();

// Hàm cập nhật total trước khi gửi
void updateWaterTotals();

// Hàm commit temp values vào EEPROM sau khi gửi thành công
void commitWaterValues();

#endif