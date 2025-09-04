import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorDataService } from '../../services/sensor-data.service';
import { lastValueFrom } from 'rxjs';
import { RoomBriefComponent } from '../room-brief/room-brief.component';
import { ElectricityBriefComponent } from '../electricity-brief/electricity-brief.component';
import { WaterBriefComponent } from '../water-brief/water-brief.component';
import { RoomBriefData } from '../../interfaces/room-brief-data';
@Component({
  imports: [
    CommonModule,
    RoomBriefComponent,
    ElectricityBriefComponent,
    WaterBriefComponent,
  ],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private sensorDataService: SensorDataService = inject(SensorDataService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  public roomsBriefData: RoomBriefData[] = [];
  public filteredRoomsBriefData: RoomBriefData[] = [];
  public totalWaterUsageLast30Days: number = -1;
  public totalElecUsageLast30Days: number = -1;
  public chartLabels: string[] = [];
  public elecChartData: number[] = [];
  public waterChartData: number[] = [];
  public elecFetchedUsage: number[][] = [];
  public waterFetchedUsage: number[][] = [];

  async ngOnInit() {
    await Promise.all([
      this.getBriefAllRooms(),
      this.getTotalWaterUsageLast30Days(),
      this.getTotalElecUsageLast30Days(),
      this.buildChartLabels(),
      this.buildElecChartData(6),
      this.buildWaterChartData(6),
    ]);
    this.filteredRoomsBriefData = this.roomsBriefData;
    this.chartLabels = [...this.chartLabels];
    this.elecChartData = [...this.elecChartData];
    this.waterChartData = [...this.waterChartData];
    this.cdr.detectChanges();
  }

  filterRooms(roomName: string) {
    if (!roomName) {
      this.filteredRoomsBriefData = this.roomsBriefData;
      return;
    }
    this.filteredRoomsBriefData = this.roomsBriefData.filter((single) =>
      single?.roomName?.toLowerCase().includes(roomName.toLowerCase())
    );
  }

  // The following functions assume that the sensors only send data to database once a day.
  // Beware of that.

  // TODO: Handle a case when there're no data available for requested day (Should get
  // the nearest lower date's record instead)
  private async getWaterUsage(
    index: number,
    date: string | undefined = undefined
  ) {
    try {
      const result = await lastValueFrom(
        this.sensorDataService.fetchWaterData(`water${index}`, date)
      );
      if (result) {
        return result[0].water ?? -1;
      } else {
        console.error('Result is undefined or not an array with data');
      }
    } catch (error) {
      console.error('Error fetching water data:', error);
    }

    return -1;
  }

  private async getElecUsage(
    index: number,
    date: string | undefined = undefined
  ) {
    try {
      const result = await lastValueFrom(
        this.sensorDataService.fetchElecData(`power${index}`, date)
      );
      if (result) {
        return result[0].power ?? -1;
      } else {
        console.error('Result is undefined or not an array with data');
      }
    } catch (error) {
      console.error('Error/Warning fetching electricity data:', error);
    }

    return -1;
  }

  private async getRoomBrief(index: number) {
    var roomBrief!: RoomBriefData;
    var pastDate: string = new Date(new Date().setDate(1))
      .toISOString()
      .slice(0, 10);
    try {
      roomBrief = roomBrief || {};

      roomBrief.elecPast = Math.floor(await this.getElecUsage(index, pastDate));
      roomBrief.elecCurrent = Math.floor(await this.getElecUsage(index));
      roomBrief.waterPast = Math.floor(
        await this.getWaterUsage(index, pastDate)
      );
      roomBrief.waterCurrent = Math.floor(await this.getWaterUsage(index));
      roomBrief.elecDue =
        ((roomBrief.elecCurrent ?? 0) - (roomBrief.elecPast ?? 0)) * 3500;
      roomBrief.waterDue =
        ((roomBrief.waterCurrent ?? 0) - (roomBrief.waterPast ?? 0)) * 15000;
      roomBrief.totalDue =
        roomBrief.totalDue || roomBrief.elecDue + roomBrief.waterDue;
    } catch (error) {
      console.error(
        `Unable to get completed data for room ${index}. Error: `,
        error
      );
    }

    // Placeholder
    roomBrief.roomName = `10${index}`;

    return roomBrief;
  }

  // Currently there are only 2 rooms available, so it will be hardcoded.
  // Should use something like $ROOMS env variable instead.
  private async getBriefAllRooms() {
    for (let i = 1; i <= 6; i++) {
      let roomBrief: RoomBriefData = await this.getRoomBrief(i);
      this.roomsBriefData.push(roomBrief);
    }
  }

  private async getTotalWaterUsageLast30Days() {
    var latest: number = 0;

    try {
      for (let i = 1; i <= 6; i++) {
        let a = await lastValueFrom(
          this.sensorDataService.fetchWaterData(`water${i}`)
        );
        if (a) {
          latest += a[0]?.water ?? 0;
        }

        let b = await lastValueFrom(
          this.sensorDataService.fetchWaterData(
            `water${i}`,
            new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10)
          )
        );
        if (b) {
          latest -= b[0]?.water ?? 0;
        }
      }
    } catch (error) {
      console.error('Error while fetching total water usage: ', error);
    }

    this.totalWaterUsageLast30Days = Math.floor(latest);
  }

  private async getTotalElecUsageLast30Days() {
    var latest: number = 0;

    try {
      for (let i = 1; i <= 6; i++) {
        let a = await lastValueFrom(
          this.sensorDataService.fetchElecData(`power${i}`)
        );
        if (a) {
          latest += a[0]?.power ?? 0;
        }

        let b = await lastValueFrom(
          this.sensorDataService.fetchElecData(
            `power${i}`,
            new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10)
          )
        );
        if (b) {
          latest -= b[0]?.power ?? 0;
        }
      }
    } catch (error) {
      console.error('Error while fetching total electricity usage: ', error);
    }

    this.totalElecUsageLast30Days = Math.floor(latest);
  }

  private async buildChartLabels() {
    for (let i = -29; i <= 0; i++) {
      this.chartLabels.push(
        new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000)
          .getUTCDate()
          .toString()
      );
    }
  }

  private async buildElecChartData(sensorCount: number) {
    try {
      let elecFetchedUsageData: { [date: string]: number } = {};
      for (let i = -29; i <= 0; i++) {
        elecFetchedUsageData[this.chartLabels[i + 29]] = 0;
        this.elecChartData.push(0);
      }

      var startDate = new Date(
        new Date(new Date().getTime() - 29 * 24 * 60 * 60 * 1000)
      );
      var endDate = new Date();

      for (let i = 1; i <= sensorCount; i++) {
        this.elecFetchedUsage.push([]);
        var lastUsageData = await lastValueFrom(
          this.sensorDataService.fetchElecData(
            `power${i}`,
            new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10)
          )
        );

        var lastUsage = 0;
        if (lastUsageData) {
          lastUsage = lastUsageData[0]?.power ?? 0;
        }

        var elecData = await lastValueFrom(
          this.sensorDataService.fetchElecDataRange(
            `power${i}`,
            startDate.toISOString().slice(0, 10),
            endDate.toISOString().slice(0, 10)
          )
        );

        if (elecData === undefined) {
          throw new Error('Unable to fetch data for elecData.');
        }

        for (let j = 0; j < elecData.length; j++) {
          let date = elecData[j]?.timestamp?.slice(8, 10);
          if (date?.slice(0, 1) === '0') date = date.slice(1, 2); // Silly fix
          if (date !== undefined) {
            let usage = elecData[j]?.power;
            if (usage) {
              this.elecFetchedUsage[i - 1].push(usage - lastUsage);
              elecFetchedUsageData[date] += usage - lastUsage;
              lastUsage = usage;
            }
          }
        }
      }

      for (let i = 0; i < 30; i++) {
        this.elecChartData[i] = elecFetchedUsageData[this.chartLabels[i]];
      }
    } catch (error) {
      console.error('Error while building data for electricity chart: ', error);
    }
  }

  private async buildWaterChartData(sensorCount: number) {
    try {
      let waterFetchedUsageData: { [date: string]: number } = {};
      for (let i = -29; i <= 0; i++) {
        waterFetchedUsageData[this.chartLabels[i + 29]] = 0;
        this.waterChartData.push(0);
      }

      var startDate = new Date(
        new Date(new Date().getTime() - 29 * 24 * 60 * 60 * 1000)
      );
      var endDate = new Date();

      for (let i = 1; i <= sensorCount; i++) {
        this.waterFetchedUsage.push([]);
        var lastUsageData = await lastValueFrom(
          this.sensorDataService.fetchWaterData(
            `water${i}`,
            new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10)
          )
        );

        var lastUsage = lastUsageData?.[0]?.water ?? 0;

        var waterData = await lastValueFrom(
          this.sensorDataService.fetchWaterDataRange(
            `water${i}`,
            startDate.toISOString().slice(0, 10),
            endDate.toISOString().slice(0, 10)
          )
        );

        if (waterData === undefined) {
          throw new Error('Unable to fetch data for waterData.');
        }

        for (let j = 0; j < waterData.length; j++) {
          let date = waterData[j]?.timestamp?.slice(8, 10);
          if (date?.slice(0, 1) === '0') date = date.slice(1, 2); // Silly fix
          if (date !== undefined) {
            let usage = waterData[j]?.water;
            if (usage) {
              this.waterFetchedUsage[i - 1].push(usage - lastUsage);
              waterFetchedUsageData[date] += usage - lastUsage;
              lastUsage = usage;
            }
          }
        }
      }

      for (let i = 0; i < 30; i++) {
        this.waterChartData[i] = waterFetchedUsageData[this.chartLabels[i]];
      }
    } catch (error) {
      console.error('Error while building data for water chart: ', error);
    }
  }
}
