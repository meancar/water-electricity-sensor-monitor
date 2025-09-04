import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-water-brief',
  standalone: true,
  imports: [BaseChartDirective, FormsModule],
  templateUrl: './water-brief.component.html',
  styleUrl: './water-brief.component.css',
})
export class WaterBriefComponent implements OnChanges {
  @Input() chartLabels: string[] = [];
  @Input() chartData: number[] = [];

  public horizontalLineValue: number | null = 1;

  public waterData: ChartData<'bar' | 'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Below Threshold (liter)',
        data: [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green for below threshold
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
      {
        label: 'Above Threshold (liter)',
        data: [],
        backgroundColor: 'rgba(255, 0, 0, 0.6)', // Red for above threshold
        borderColor: 'rgba(255, 0, 0, 1)',
        borderWidth: 1,
        stack: 'combined',
      },
    ],
  };

  public waterOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'liter' },
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
    const aboveThresholdData = data.map((value) => Math.max(0, value - threshold));

    const belowThresholdDataset = {
      label: 'Below Threshold (liter)',
      data: belowThresholdData,
      backgroundColor: 'rgba(34, 197, 94, 0.6)', // Green
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 1,
      stack: 'combined',
    };
    const aboveThresholdDataset = {
      label: 'Above Threshold (liter)',
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

    this.waterData = {
      labels: labels,
      datasets: horizontalLineDataset
        ? [belowThresholdDataset, aboveThresholdDataset, horizontalLineDataset]
        : [belowThresholdDataset, aboveThresholdDataset],
    };
  }
}