import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Requerimientos } from './requerimientos';

describe('Requerimientos', () => {
  let component: Requerimientos;
  let fixture: ComponentFixture<Requerimientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Requerimientos],
    }).compileComponents();

    fixture = TestBed.createComponent(Requerimientos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
