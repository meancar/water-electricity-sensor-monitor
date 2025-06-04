#ifndef DATAPUSH_H
#define DATAPUSH_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiManager.h>


void internetInit();

void PusherE(const String &nodeId ,const String &sensorId, float power, float voltage);
void PusherW(const String &nodeId,const String &sensorId, float water);
void PushRssi(String const &nodeId,int rssi);

#endif