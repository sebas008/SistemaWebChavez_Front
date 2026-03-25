import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';
import { AuthService } from '../../core/services/auth';

interface ObraDto { idObra: number; codigo: string; nombre: string; activa: boolean; }
interface PartidaDto { idPartida: number; nombre: string; activo: boolean; }
interface UnidadMedidaDto { idUnidadMedida: number; codigo: string; nombre: string; activo: boolean; }
interface ItemDto { idItem: number; descripcion: string; partida?: string | null; idUnidadMedida?: number | null; activo: boolean; }
interface RequerimientoDetalleDto { idRequerimientoDetalle?: number | null; idItem: number; idPartida?: number | null; idUnidadMedida?: number | null; cantidad: number; comentario?: string | null; observacion?: string | null; destino?: string | null; }
interface RequerimientoDto { idRequerimiento: number; codigo: string; idObra: number; fechaSolicitud: string; estado: string; observacion?: string | null; entregaATiempo?: boolean | null; detalle: RequerimientoDetalleDto[]; }
interface RequerimientoDetalleForm { idPartida: number | null; idItem: number; cantidad: number; idUnidadMedida: number | null; comentario: string; }

@Component({
  selector: 'app-requerimientos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './requerimientos.html',
  styleUrl: './requerimientos.scss',
})
export class Requerimientos implements OnInit {
  rows: RequerimientoDto[] = [];
  obras: ObraDto[] = [];
  partidas: PartidaDto[] = [];
  unidades: UnidadMedidaDto[] = [];
  items: ItemDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  estadoOpen = false;
  estadoTarget: RequerimientoDto | null = null;
  nuevoEstado = '';
  estadoObservacion = '';
  entregaATiempo: boolean | null = null;
  destinoOpen = false;
  destinoTarget: RequerimientoDto | null = null;
  destinoRows: RequerimientoDetalleDto[] = [];
  readonly estados = ['PENDIENTE', 'APROBADO', 'OBSERVADO', 'ATENDIDO', 'ANULADO'];
  readonly destinos = ['COMPRA', 'ALMACEN_INTERNO'];

  form = {
    idObra: null as number | null,
    observacion: '',
    detalle: [] as RequerimientoDetalleForm[],
  };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  get isMaster(): boolean { return this.auth.hasRole('MASTER'); }
  get isLogistica(): boolean { return this.auth.hasRole('LOGISTICA'); }
  get isOficinaTecnica(): boolean { return this.auth.hasRole('OFICINA_TECNICA'); }
  get isObras(): boolean { return this.auth.hasRole('OBRAS'); }
  canCrearRequerimiento(): boolean { return this.isMaster || this.isObras || this.isOficinaTecnica; }
  canGestionarDestinos(): boolean { return this.isMaster || this.isLogistica || this.isOficinaTecnica; }
  canCambiarEstado(): boolean { return this.isMaster || this.isObras || this.isOficinaTecnica; }

  private newDetalle(): RequerimientoDetalleForm {
    return {
      idPartida: this.partidas[0]?.idPartida ?? null,
      idItem: this.items[0]?.idItem ?? 0,
      cantidad: 1,
      idUnidadMedida: this.items[0]?.idUnidadMedida ?? this.unidades[0]?.idUnidadMedida ?? null,
      comentario: '',
    };
  }

  itemDescripcion(idItem: number): string {
    return this.items.find(x => x.idItem === idItem)?.descripcion || ('Item #' + idItem);
  }

  private loadLookups() {
    this.api.get<ObraDto[]>('/maestros/obras', { soloActivas: true }).subscribe({ next: d => this.obras = d || [], error: () => this.obras = [] });
    this.api.get<PartidaDto[]>('/maestros/partidas', { soloActivas: true }).subscribe({ next: d => { this.partidas = d || []; this.ensureDetalle(); }, error: () => { this.partidas = []; this.ensureDetalle(); } });
    this.api.get<UnidadMedidaDto[]>('/maestros/unidades-medida').subscribe({ next: d => { this.unidades = d || []; this.ensureDetalle(); }, error: () => { this.unidades = []; this.ensureDetalle(); } });
    this.api.get<ItemDto[]>('/inventario/items', { soloActivos: true }).subscribe({ next: d => { this.items = d || []; this.ensureDetalle(); }, error: () => { this.items = []; this.ensureDetalle(); } });
  }

  private ensureDetalle() {
    if (!this.form.detalle.length) this.form.detalle = [this.newDetalle()];
  }

  obraNombre(idObra: number): string {
    return this.obras.find((x) => x.idObra === idObra)?.nombre || `Obra #${idObra}`;
  }

  destinoLabel(destino?: string | null): string {
    if (!destino) return '-';
    return destino === 'ALMACEN_INTERNO' ? 'Almacén interno' : 'Compra';
  }

  formatearFecha(fecha?: string | null): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-PE');
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<RequerimientoDto[]>('/logistica/requerimientos').subscribe({
      next: (d) => { this.rows = d || []; this.loading = false; this.forceRender(); },
      error: (e) => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.forceRender(); },
    });
  }

  openNew() {
    if (!this.canCrearRequerimiento()) {
      this.notify.error('No tienes permiso para crear requerimientos.');
      return;
    }
    this.form = { idObra: this.obras[0]?.idObra ?? null, observacion: '', detalle: [this.newDetalle()] };
    this.modalOpen = true;
  }

  closeModal() { this.modalOpen = false; setTimeout(() => this.forceRender(), 0); }
  addRow() { this.form.detalle.push(this.newDetalle()); }
  removeRow(idx: number) { this.form.detalle.splice(idx, 1); if (this.form.detalle.length === 0) this.addRow(); }

  onItemChange(d: RequerimientoDetalleForm) {
    const item = this.items.find((x) => x.idItem === Number(d.idItem));
    if (item?.idUnidadMedida) d.idUnidadMedida = item.idUnidadMedida;
  }

  save() {
    this.error = null;
    if (!this.form.idObra) { this.error = 'Selecciona una obra.'; return; }

    const detalle = (this.form.detalle || [])
      .filter((x) => !!x.idItem && Number(x.cantidad) > 0)
      .map((x) => ({
        idItem: Number(x.idItem),
        idPartida: x.idPartida ? Number(x.idPartida) : null,
        idUnidadMedida: x.idUnidadMedida ? Number(x.idUnidadMedida) : null,
        cantidad: Number(x.cantidad),
        comentario: x.comentario?.trim() || null,
        observacion: null,
      }));

    if (!detalle.length) { this.error = 'Agrega al menos un ítem válido.'; return; }

    const payload = {
      idObra: Number(this.form.idObra),
      observacion: this.form.observacion?.trim() || null,
      detalle,
      idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
    };

    this.api.post<any>('/logistica/requerimientos', payload).subscribe({
      next: () => { this.notify.success('Requerimiento guardado.'); this.closeModal(); this.load(); },
      error: (e) => { this.error = e?.message || 'No se pudo guardar.'; this.notify.error(this.error); },
    });
  }

  openCambiarEstado(row: RequerimientoDto) {
    this.estadoTarget = row;
    this.nuevoEstado = row.estado || 'PENDIENTE';
    this.estadoObservacion = '';
    this.entregaATiempo = row.entregaATiempo ?? null;
    this.estadoOpen = true;
  }

  closeEstado() {
    this.estadoOpen = false;
    this.estadoTarget = null;
    this.nuevoEstado = '';
    this.estadoObservacion = '';
    this.entregaATiempo = null;
    setTimeout(() => this.forceRender(), 0);
  }

  guardarEstado() {
    if (!this.estadoTarget) return;

    const payload: any = {
      estado: this.nuevoEstado,
      idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
      observacion: this.nuevoEstado === 'OBSERVADO' ? (this.estadoObservacion?.trim() || null) : null,
    };

    if (this.nuevoEstado === 'ATENDIDO') payload.entregaATiempo = this.entregaATiempo;

    this.api.put<any>(`/logistica/requerimientos/${this.estadoTarget.idRequerimiento}/estado`, payload).subscribe({
      next: () => { this.notify.success('Estado actualizado.'); this.closeEstado(); this.load(); },
      error: (e) => this.notify.error(e?.message || 'No se pudo actualizar estado.'),
    });
  }

  openDestino(row: RequerimientoDto) {
    this.destinoTarget = row;
    this.destinoRows = [];
    this.destinoOpen = true;

    this.api.get<RequerimientoDto>(`/logistica/requerimientos/${row.idRequerimiento}`).subscribe({
      next: (resp) => { this.destinoRows = resp?.detalle || []; this.forceRender(); },
      error: (e) => { this.notify.error(e?.message || 'No se pudo cargar el detalle.'); this.closeDestino(); },
    });
  }

  closeDestino() {
    this.destinoOpen = false;
    this.destinoTarget = null;
    this.destinoRows = [];
    setTimeout(() => this.forceRender(), 0);
  }

  async guardarDestinos() {
    const pendientes = (this.destinoRows || []).filter((x) => !!x.idRequerimientoDetalle && !!x.destino);
    if (!pendientes.length || !this.destinoTarget) {
      this.notify.error('Selecciona al menos un destino.');
      return;
    }

    try {
      await Promise.all(
        pendientes.map((d) =>
          firstValueFrom(
            this.api.put<any>(`/logistica/requerimientos/detalle/${d.idRequerimientoDetalle}/destino`, {
              destino: d.destino || null,
              idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
            })
          )
        )
      );

      await firstValueFrom(
        this.api.put<any>(`/logistica/requerimientos/${this.destinoTarget.idRequerimiento}/estado`, {
          estado: 'DERIVADO',
          idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
        })
      );

      this.notify.success('Destinos actualizados.');
      this.closeDestino();
      this.load();
    } catch (e: any) {
      this.notify.error(e?.message || 'No se pudieron guardar los destinos.');
    }
  }

  private forceRender() {
    try {
      this.cdr.detectChanges();
      setTimeout(() => {
        try { this.cdr.detectChanges(); } catch {}
      }, 0);
    } catch {}
  }
}
