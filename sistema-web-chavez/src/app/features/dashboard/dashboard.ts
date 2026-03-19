import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';

type DashboardKpisResponse = {
  porcentajeEntregaCompleta?: number;
  porcentajeEntregaATiempo?: number;
  porcentajeCompra?: number;
  porcentajeAlmacenInterno?: number;
  PorcentajeEntregaCompleta?: number;
  PorcentajeEntregaATiempo?: number;
  PorcentajeCompra?: number;
  PorcentajeAlmacenInterno?: number;
};

type IndicadoresRequerimientos = {
  entregaCompleta: number;
  entregaATiempo: number;
  compra: number;
  almacenInterno: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  loading = false;
  error: string | null = null;
  indicadores: IndicadoresRequerimientos = { entregaCompleta: 0, entregaATiempo: 0, compra: 0, almacenInterno: 0 };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.get<DashboardKpisResponse>('/dashboard/kpis').subscribe({
      next: (d) => {
        this.indicadores = {
          entregaCompleta: this.toNumber(d?.porcentajeEntregaCompleta ?? d?.PorcentajeEntregaCompleta),
          entregaATiempo: this.toNumber(d?.porcentajeEntregaATiempo ?? d?.PorcentajeEntregaATiempo),
          compra: this.toNumber(d?.porcentajeCompra ?? d?.PorcentajeCompra),
          almacenInterno: this.toNumber(d?.porcentajeAlmacenInterno ?? d?.PorcentajeAlmacenInterno)
        };
        this.loading = false;
        this.forceRender();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.message || 'No se pudo cargar el dashboard.';
        this.forceRender();
      }
    });
  }

  formatPercent(value: number | null | undefined): string {
    const n = this.toNumber(value);
    return `${n.toFixed(2)}%`;
  }

  private toNumber(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private forceRender(): void {
    try {
      this.cdr.detectChanges();
      setTimeout(() => { try { this.cdr.detectChanges(); } catch {} }, 0);
    } catch {}
  }
}