import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';
import { AuthService } from '../../core/services/auth';

interface ObraDto {
  idObra: number;
  nombre: string;
}
interface AlmacenDto {
  idAlmacen: number;
  tipo: string;
  idObra?: number | null;
  codigo: string;
  nombre: string;
  activo: boolean;
}
interface ItemDto {
  idItem: number;
  descripcion: string;
}

interface AtencionDetalleDto {
  idItem: number;
  cantidad: number;
  observacion?: string | null;
}

interface AtencionDto {
  idAtencion: number;
  codigo: string;
  fecha: string;
  idObra: number;
  idAlmacenOrigen: number;
  idAlmacenDestino: number;
  metodoAtencion: string;
  estado: string;
  observacion?: string | null;
  detalle: AtencionDetalleDto[];
}

@Component({
  selector: 'app-logistica-interna',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './logistica-interna.html',
  styleUrl: './logistica-interna.scss',
})
export class LogisticaInterna implements OnInit {
  rows: AtencionDto[] = [];
  obras: ObraDto[] = [];
  almacenes: AlmacenDto[] = [];
  items: ItemDto[] = [];

  loading = false;
  error: string | null = null;

  modalOpen = false;
  estadoOpen = false;
  estadoTarget: AtencionDto | null = null;
  nuevoEstado = '';

  readonly estados = ['GENERADA','ENTREGADA','ANULADA'];

  form = {
    idObra: null as number | null,
    idAlmacenOrigen: null as number | null,
    idAlmacenDestino: null as number | null,
    metodoAtencion: 'DIRECTO',
    observacion: '',
    detalle: [{ idItem: 0, cantidad: 1, observacion: '' }] as Array<{ idItem: number; cantidad: number; observacion?: string }>,
  };

  constructor(private cdr: ChangeDetectorRef,private api: ApiService, private notify: NotifyService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }


  private loadLookups() {
    this.api.get<ObraDto[]>('/maestros/obras', { soloActivas: true }).subscribe({
      next: (d) => (this.obras = d || []),
      error: () => (this.obras = []),
    });
    this.api.get<AlmacenDto[]>('/inventario/almacenes', { soloActivos: true }).subscribe({
      next: (d) => (this.almacenes = d || []),
      error: () => (this.almacenes = []),
    });
    this.api.get<ItemDto[]>('/inventario/items', { soloActivos: true }).subscribe({
      next: (d) => (this.items = d || []),
      error: () => (this.items = []),
    });
  }

  obraNombre(id: number): string {
    return this.obras.find((o) => o.idObra === id)?.nombre || `Obra #${id}`;
  }
  almNombre(id: number): string {
    const a = this.almacenes.find((x) => x.idAlmacen === id);
    return a ? `${a.nombre}` : `Almacén #${id}`;
  }

  get almacenesInternos(): AlmacenDto[] {
    return (this.almacenes || []).filter((a) => (a.tipo || '').toUpperCase() === 'INTERNO');
  }
  get almacenesObra(): AlmacenDto[] {
    return (this.almacenes || []).filter((a) => (a.tipo || '').toUpperCase() === 'OBRA');
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<AtencionDto[]>('/logistica/atenciones').subscribe({
      next: (d) => {
        this.rows = d || [];
        this.loading = false;
              this.forceRender();
},
      error: (e) => {
        this.loading = false;
                this.forceRender();
this.error = e?.message || 'No se pudo cargar.';
        this.notify.error(this.error);
      },
    });
  }

  openNew() {
    this.form = {
      idObra: this.obras[0]?.idObra ?? null,
      idAlmacenOrigen: this.almacenesInternos[0]?.idAlmacen ?? null,
      idAlmacenDestino: this.almacenesObra[0]?.idAlmacen ?? null,
      metodoAtencion: 'DIRECTO',
      observacion: '',
      detalle: [{ idItem: this.items[0]?.idItem ?? 0, cantidad: 1, observacion: '' }],
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    setTimeout(() => this.forceRender(), 0);
  }

  addRow() {
    this.form.detalle.push({ idItem: this.items[0]?.idItem ?? 0, cantidad: 1, observacion: '' });
  }

  removeRow(i: number) {
    this.form.detalle.splice(i, 1);
    if (this.form.detalle.length === 0) this.addRow();
  }


  openCambiarEstado(row: AtencionDto) {
    this.estadoTarget = row;
    this.nuevoEstado = row.estado;
    this.estadoOpen = true;
  }

  closeEstado() {
    this.estadoOpen = false;
    this.estadoTarget = null;
    this.nuevoEstado = '';
    setTimeout(() => this.forceRender(), 0);
  }

  guardarEstado() {
    if (!this.estadoTarget) return;
    const estado = (this.nuevoEstado || '').trim().toUpperCase();
    if (!estado) {
      this.notify.error('Selecciona un estado.');
      return;
    }
    this.api.put<any>(`/logistica/atenciones/${this.estadoTarget.idAtencion}/estado`, { estado }).subscribe({
      next: () => {
        this.notify.success('Estado actualizado.');
        this.closeEstado();
        this.load();
      },
      error: (e) => {
        const msg = e?.message || 'No se pudo cambiar estado.';
        this.notify.error(msg);
      },
    });
  }

  save() {
    this.error = null;
    if (!this.form.idObra) {
      this.error = 'Selecciona una obra.';
      return;
    }
    if (!this.form.idAlmacenOrigen) {
      this.error = 'Selecciona almacén origen (interno).';
      return;
    }
    if (!this.form.idAlmacenDestino) {
      this.error = 'Selecciona almacén destino (obra).';
      return;
    }
    const det = (this.form.detalle || [])
      .filter((x) => !!x.idItem && Number(x.cantidad) > 0)
      .map((x) => ({
        idItem: Number(x.idItem),
        cantidad: Number(x.cantidad),
        observacion: x.observacion?.trim() || null,
      }));
    if (det.length === 0) {
      this.error = 'Agrega al menos 1 ítem.';
      return;
    }

    const payload = {
      idObra: Number(this.form.idObra),
      idAlmacenOrigen: Number(this.form.idAlmacenOrigen),
      idAlmacenDestino: Number(this.form.idAlmacenDestino),
      metodoAtencion: (this.form.metodoAtencion || 'DIRECTO').toUpperCase(),
      observacion: this.form.observacion?.trim() || null,
      detalle: det,
      idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
    };

    this.api.post<any>('/logistica/atenciones/desde-almacen-interno', payload).subscribe({
      next: () => {
        this.notify.success('Atención registrada.');
        this.closeModal();
        this.load();
      },
      error: (e) => {
        this.error = e?.message || 'No se pudo guardar.';
        this.notify.error(this.error);
      },
    });
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
