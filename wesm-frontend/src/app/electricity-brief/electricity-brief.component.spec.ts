import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectricityBriefComponent } from './electricity-brief.component';

describe('ElectricityBriefComponent', () => {
  let component: ElectricityBriefComponent;
  let fixture: ComponentFixture<ElectricityBriefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElectricityBriefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElectricityBriefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
