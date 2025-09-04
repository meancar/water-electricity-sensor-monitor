import { Component, Input } from '@angular/core';
import { RoomBriefData } from '../../interfaces/room-brief-data';
import { RoomDetailsComponent } from '../room-details/room-details.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-room-brief',
  standalone: true,
  imports: [CommonModule, RoomDetailsComponent],
  templateUrl: './room-brief.component.html',
  styleUrl: './room-brief.component.css',
})
export class RoomBriefComponent {
  @Input() index!: number;
  @Input() roomData!: RoomBriefData;
  @Input() chartLabels!: string[];
  @Input() elecFetchedUsage!: number[][];
  @Input() waterFetchedUsage!: number[][];
  showRoomDetails: boolean = false;

  toggleRoomDetails() {
    this.showRoomDetails = !this.showRoomDetails;
  }
  constructor() {}
}
