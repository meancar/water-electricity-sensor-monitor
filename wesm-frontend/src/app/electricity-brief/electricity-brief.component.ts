import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-electricity-brief',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './electricity-brief.component.html',
  styleUrls: ['./electricity-brief.component.css'],
})
export class ElectricityBriefComponent implements OnChanges {
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];

  // Initialize electricityData with empty values
  public electricityData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Electricity (kWh)',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Electricity chart options
  public electricityOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kWh' },
      },
      x: {
        title: { display: true, text: 'Day' },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
  };

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartLabels'] || changes['chartData']) {
      // Update electricityData when inputs change
      this.electricityData = {
        labels: this.chartLabels || [],
        datasets: [
          {
            label: 'Electricity (kWh)',
            data: this.chartData || [],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      };
      console.log('Updated electricityData:', this.electricityData);
    }
  }
}
