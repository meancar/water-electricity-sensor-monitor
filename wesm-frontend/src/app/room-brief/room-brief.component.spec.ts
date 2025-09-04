import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomBriefComponent } from './room-brief.component';

describe('RoomBriefComponent', () => {
  let component: RoomBriefComponent;
  let fixture: ComponentFixture<RoomBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomBriefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
