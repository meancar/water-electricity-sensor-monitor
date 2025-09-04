import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ElecData } from '../interfaces/elec-data';
import { WaterData } from '../interfaces/water-data';

@Injectable({
  providedIn: 'root',
})
export class SensorDataService {
  http: HttpClient = inject(HttpClient);
  baseUrl: string = 'http://localhost:3000/api/get';

  fetchWaterData(sensorId: string, date: string | undefined = undefined) {
    var baseParams = new HttpParams();
    baseParams = baseParams.set('type', 'water');
    baseParams = baseParams.set('sensor_id', sensorId);
    if (date !== undefined) baseParams = baseParams.set('date', date);

    return this.http.get<WaterData[] | undefined>(this.baseUrl, {
      params: baseParams,
    });
  }

  fetchWaterDataRange(sensorId: string, startDate: string, endDate: string) {
    var baseParams = new HttpParams();
    baseParams = baseParams.set('type', 'water');
    baseParams = baseParams.set('sensor_id', sensorId);
    baseParams = baseParams.set('start_date', startDate);
    baseParams = baseParams.set('end_date', endDate);

    return this.http.get<WaterData[] | undefined>(`${this.baseUrl}/range`, {
      params: baseParams,
    });
  }

  fetchElecData(sensorId: string, date: string | undefined = undefined) {
    var baseParams = new HttpParams();
    baseParams = baseParams.set('type', 'elec');
    baseParams = baseParams.set('sensor_id', sensorId);
    if (date !== undefined) baseParams = baseParams.set('date', date);

    return this.http.get<ElecData[] | undefined>(this.baseUrl, {
      params: baseParams,
    });
  }

  fetchElecDataRange(sensorId: string, startDate: string, endDate: string) {
    var baseParams = new HttpParams();
    baseParams = baseParams.set('type', 'elec');
    baseParams = baseParams.set('sensor_id', sensorId);
    baseParams = baseParams.set('start_date', startDate);
    baseParams = baseParams.set('end_date', endDate);

    return this.http.get<ElecData[] | undefined>(`${this.baseUrl}/range`, {
      params: baseParams,
    });
  }

  constructor() {}
}
