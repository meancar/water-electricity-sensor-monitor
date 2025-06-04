#include "dataPush.h"

WiFiManager wifiManager;
String serverUrl = "http://192.168.0.150:3000/stream_data";

void internetInit(){
    // WiFi.mode(WIFI_STA);
    // wm.setConfigPortalBlocking(false);
    // wm.setConfigPortalTimeout(60);
    // bool res;
    // res = wm.autoConnect("Gateway1", "mesh1234");
    // if (!res){
    //     Serial.println("Failed to connect!");
    // }
    // else {
    //     Serial.println("Connected!");
    // }

    wifiManager.setConfigPortalTimeout(180);
    if(!wifiManager.autoConnect("GATEWAY-01","12345678")) {
        Serial.println("failed to connect and hit timeout");
        delay(3000);
        //reset and try again, or maybe put it to deep sleep
        delay(5000);
      } 
}

void PusherE(const String &nodeId ,const String &sensorId, float power, float voltage = 0){
     if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;

         // Thay bằng IP của server
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Tạo JSON string
        String jsonPayload = "{";
        jsonPayload += "\"node_id\":\"" + nodeId + "\",";
        jsonPayload += "\"sensor_id\":\"" + sensorId + "\",";       
        jsonPayload += "\"power\":" + String(power);
        if (voltage > 0)
        {
            jsonPayload += ",\"voltage\":" + String(voltage);
        }
        jsonPayload += "}";

        // Gửi POST request
        Serial.println(jsonPayload);
        int httpResponseCode = http.POST(jsonPayload);

        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode == 200)
        {
            Serial.println("✅ Gửi dữ liệu thành công\n");
        }
        else
        {
            Serial.println("❌ Gửi dữ liệu thất bại\n");
        }

        http.end();
    }
    else
    {
        Serial.println("⚠️ WiFi chưa kết nối!");
    }
}

void PusherW(const String &nodeId,const String &sensorId, float water){
    if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;

         // Thay bằng IP của server
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Tạo JSON string
        String jsonPayload = "{";
        jsonPayload += "\"node_id\":\"" + nodeId + "\",";
        jsonPayload += "\"sensor_id\":\"" + sensorId + "\",";
        jsonPayload += "\"water\":" + String(water);
        jsonPayload += "}";

        // Gửi POST request
        Serial.println(jsonPayload);
        int httpResponseCode = http.POST(jsonPayload);

        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode == 200)
        {
            Serial.println("✅ Gửi dữ liệu thành công\n");
        }
        else
        {
            Serial.println("❌ Gửi dữ liệu thất bại\n");
        }

        http.end();
    }
    else
    {
        Serial.println("⚠️ WiFi chưa kết nối!");
    }
}

void PushRssi(String const &nodeId,int rssi){
        if (WiFi.status() == WL_CONNECTED)
    {
        HTTPClient http;

        // Thay bằng IP của server
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");

        // Tạo JSON string
        String jsonPayload = "{";
        jsonPayload += "\"node_id\":\"" + nodeId + "\",";
        jsonPayload += "\"sensor_id\":\"rssi\",";  // chọn collection
        jsonPayload += "\"rssi\":" + String(rssi);
        jsonPayload += "}";

        // Gửi POST request
        Serial.println(jsonPayload);
        int httpResponseCode = http.POST(jsonPayload);

        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);

        if (httpResponseCode == 200)
        {
            Serial.println("✅ Gửi dữ liệu thành công\n");
        }
        else
        {
            Serial.println("❌ Gửi dữ liệu thất bại\n");
        }

        http.end();
    }
    else
    {
        Serial.println("⚠️ WiFi chưa kết nối!");
    }
}