import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-water-brief',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './water-brief.component.html',
  styleUrl: './water-brief.component.css',
})
export class WaterBriefComponent implements OnChanges {
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];

  // Water chart data
  public waterData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Water (m³)',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Water chart options
  public waterOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'm³' },
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
      this.waterData = {
        labels: this.chartLabels || [],
        datasets: [
          {
            label: 'Water (m³)',
            data: this.chartData || [],
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
        ],
      };
      console.log('Updated waterData:', this.waterData);
    }
  }
}
