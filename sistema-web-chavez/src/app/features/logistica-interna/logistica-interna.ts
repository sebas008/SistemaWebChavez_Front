import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface AtencionBandejaDto {
  idRequerimientoDetalle: number;
  nroReq: string;
  nomObra: string;
  item: string;
  cantidad: number;
  fecha?: string | null;
  estado: string;
}

@Component({
  selector: 'app-logistica-interna',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logistica-interna.html',
  styleUrl: './logistica-interna.scss',
})
export class LogisticaInterna implements OnInit {
  rows: AtencionBandejaDto[] = [];
  loading = false;
  error: string | null = null;
  estadoOpen = false;
  estadoTarget: AtencionBandejaDto | null = null;
  nuevoEstado = '';
  entregaATiempo: boolean | null = null;
  readonly estados = ['COMPRADO', 'ENTREGADO'];
  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService) {}
  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<AtencionBandejaDto[]>('/logistica/atenciones-bandeja').subscribe({
      next: d => { this.rows = d || []; this.loading = false; this.render(); },
      error: e => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.render(); }
    });
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '-';
    const v = String(fecha).trim();
    if (v.startsWith('0001-01-01') || v.startsWith('0000-00-00')) return '-';
    const d = new Date(v);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  openCambiarEstado(r: AtencionBandejaDto) { this.estadoTarget = r; this.nuevoEstado = r.estado || 'COMPRADO'; this.entregaATiempo = null; this.estadoOpen = true; }
  closeEstado() { this.estadoOpen = false; this.estadoTarget = null; this.nuevoEstado = ''; this.entregaATiempo = null; this.render(); }

  guardarEstado() {
    if (!this.estadoTarget) return;
    const estado = (this.nuevoEstado || '').trim().toUpperCase();
    if (!estado) { this.notify.error('Selecciona un estado.'); return; }
    if (estado === 'ENTREGADO' && this.entregaATiempo === null) { this.notify.error('Indica si fue a tiempo.'); return; }

    this.api.put(`/logistica/requerimientos/detalle/${this.estadoTarget.idRequerimientoDetalle}/estado`, {
      estado, entregaATiempo: estado === 'ENTREGADO' ? this.entregaATiempo : null
    }).subscribe({
      next: () => { this.notify.success('Estado actualizado.'); this.closeEstado(); this.load(); },
      error: e => this.notify.error(e?.message || 'No se pudo cambiar estado.')
    });
  }

  private render() { try { this.cdr.detectChanges(); } catch {} }
}
