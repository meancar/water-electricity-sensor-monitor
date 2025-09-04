import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterBriefComponent } from './water-brief.component';

describe('WaterBriefComponent', () => {
  let component: WaterBriefComponent;
  let fixture: ComponentFixture<WaterBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterBriefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
