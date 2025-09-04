import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnChanges,
  SimpleChanges,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { RoomBriefData } from '../../interfaces/room-brief-data';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './room-details.component.html',
  styleUrls: ['./room-details.component.css'],
  animations: [
    trigger('fadeSlideInOut', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(-20%)',
        })
      ),
      transition(':enter', [
        animate(
          '150ms ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          })
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({
            opacity: 0,
            transform: 'translateY(-20%)',
          })
        ),
      ]),
    ]),
  ],
})
export class RoomDetailsComponent implements OnChanges {
  @Input() roomData!: RoomBriefData;
  @Input() chartLabels!: string[];
  @Input() elecUsageChartData!: number[];
  @Input() waterUsageChartData!: number[];
  @Output() close = new EventEmitter<void>();

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;
  pdfCharts: BaseChartDirective[] = [];

  // Chart data for electricity (past 30 days)
  electricityChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Electricity (kWh)',
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart data for water (past 30 days)
  waterChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Water (m³)',
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  elecChartOptions: ChartConfiguration['options'] = {
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

  waterChartOptions: ChartConfiguration['options'] = {
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

  async printPDF() {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin + 10; // Start after title

    // Add title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Room ${this.roomData.roomName} Details`, margin, margin + 5);

    // Add room data table using autoTable
    autoTable(pdf, {
      startY: yPosition,
      head: [['Utility', 'Past', 'Current', 'Usage', 'Due']],
      body: [
        [
          'Electricity',
          `${this.roomData.elecPast} kWh`,
          `${this.roomData.elecCurrent} kWh`,
          `${
            (this.roomData.elecCurrent ?? 0) - (this.roomData.elecPast ?? 0)
          } kWh`,
          {
            content: `${this.roomData.elecDue} VND`,
            styles: { textColor: [220, 38, 38] },
          },
        ],
        [
          'Water',
          `${this.roomData.waterPast} m³`,
          `${this.roomData.waterCurrent} m³`,
          `${
            (this.roomData.waterCurrent ?? 0) - (this.roomData.waterPast ?? 0)
          } m³`,
          {
            content: `${this.roomData.waterDue} VND`,
            styles: { textColor: [220, 38, 38] },
          },
        ],
        [
          '',
          '',
          '',
          {
            content: 'Total Due: ',
            styles: { fontStyle: 'bold' },
          },
          {
            content: `${this.roomData.totalDue ?? 0} VND`,
            styles: { textColor: [220, 38, 38], fontStyle: 'bold' },
          },
        ],
      ],
      theme: 'striped',
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [55, 65, 81],
        fontStyle: 'bold',
      },
      bodyStyles: { textColor: [55, 65, 81] },
      margin: { left: margin, right: margin },
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 10;

    const addChartToPDF = (chart: BaseChartDirective, title: string) => {
      const canvas = chart.chart?.canvas;
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error(`Canvas for ${title} is not ready or has zero size`);
        return;
      }

      const chartImg = canvas.toDataURL('image/png');
      const aspectRatio = canvas.height / canvas.width;
      const pdfWidth = maxWidth;
      const pdfHeight = pdfWidth * aspectRatio;

      // Add chart title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 5;

      // Add chart image
      pdf.addImage(chartImg, 'PNG', margin, yPosition, pdfWidth, pdfHeight);
      yPosition += pdfHeight + 10;
    };

    if (this.pdfCharts) {
      addChartToPDF(this.pdfCharts[0], 'Electricity Usage (Past 30 Days)');
      addChartToPDF(this.pdfCharts[1], 'Water Usage (Past 30 Days)');
    }

    // Add footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on ${new Date().toLocaleString()}`,
      margin,
      pageHeight - margin
    );

    pdf.save(`Room_${this.roomData.roomName}_Details.pdf`);
  }

  onClose() {
    this.close.emit();
  }

  constructor() {}

  ngAfterViewInit() {
    this.charts.forEach((chart) => {
      this.pdfCharts.push(chart);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartLabels'] || changes['elecUsageChartData']) {
      this.electricityChartData = {
        labels: this.chartLabels || [],
        datasets: [
          {
            label: 'Electricity (kWh)',
            data: this.elecUsageChartData || [],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
          },
        ],
      };
      console.log('Updated electricityChartData:', this.electricityChartData);
    }

    if (changes['chartLabels'] || changes['waterUsageChartData']) {
      this.waterChartData = {
        labels: this.chartLabels || [],
        datasets: [
          {
            label: 'Water (m³)',
            data: this.waterUsageChartData || [],
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 1,
          },
        ],
      };
      console.log('Updated waterUsageChartData:', this.waterUsageChartData);
    }
  }
}
