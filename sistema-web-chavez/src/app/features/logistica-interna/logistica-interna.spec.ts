import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogisticaInterna } from './logistica-interna';

describe('LogisticaInterna', () => {
  let component: LogisticaInterna;
  let fixture: ComponentFixture<LogisticaInterna>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogisticaInterna],
    }).compileComponents();

    fixture = TestBed.createComponent(LogisticaInterna);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
