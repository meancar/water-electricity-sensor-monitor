import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-electricity-brief',
  standalone: true,
  imports: [BaseChartDirective, FormsModule],
  templateUrl: './electricity-brief.component.html',
  styleUrls: ['./electricity-brief.component.css'],
})
export class ElectricityBriefComponent implements OnChanges {
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];

  public horizontalLineValue: number | null = 1;

  public electricityData: ChartData<'bar' | 'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Below Threshold (kWh)',
        data: [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue for below threshold
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
      {
        label: 'Above Threshold (kWh)',
        data: [],
        backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red for above threshold
        borderColor: 'rgba(255, 0, 0, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
    ],
  };

  public electricityOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kWh' },
        stacked: true,
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
      this.updateChartData();
    }
  }

  updateHorizontalLine(): void {
    this.updateChartData();
  }

  private updateChartData(): void {
    const labels = this.chartLabels || [];
    const data = this.chartData || [];
    const threshold = this.horizontalLineValue || 0;

    const belowThresholdData = data.map((value) => Math.min(value, threshold));
    const aboveThresholdData = data.map((value, index) =>
      Math.max(0, value - threshold)
    );

    const belowThresholdDataset = {
      label: 'Below Threshold (kWh)',
      data: belowThresholdData,
      backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      stack: 'combined',
    };
    const aboveThresholdDataset = {
      label: 'Above Threshold (kWh)',
      data: aboveThresholdData,
      backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red
      borderColor: 'rgba(255, 0, 0, 1)',
      borderWidth: 1,
      stack: 'combined',
    };

    const horizontalLineDataset =
      this.horizontalLineValue !== null
        ? {
            label: 'Threshold',
            data: Array(labels.length).fill(this.horizontalLineValue),
            type: 'line' as const,
            borderColor: 'red',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            borderDash: [5, 5],
          }
        : null;

    this.electricityData = {
      labels: labels,
      datasets: horizontalLineDataset
        ? [belowThresholdDataset, aboveThresholdDataset, horizontalLineDataset]
        : [belowThresholdDataset, aboveThresholdDataset],
    };
  }
}
