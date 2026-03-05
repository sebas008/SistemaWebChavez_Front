import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';
import { AuthService } from '../../core/services/auth';

interface ObraDto {
  idObra: number;
  codigo: string;
  nombre: string;
  activa: boolean;
}

interface ItemDto {
  idItem: number;
  descripcion: string;
  activo: boolean;
}

interface RequerimientoDetalleDto {
  idItem: number;
  cantidad: number;
  observacion?: string | null;
}

interface RequerimientoDto {
  idRequerimiento: number;
  codigo: string;
  idObra: number;
  fechaSolicitud: string;
  estado: string;
  observacion?: string | null;
  detalle: RequerimientoDetalleDto[];
}

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
  items: ItemDto[] = [];

  loading = false;
  error: string | null = null;

  modalOpen = false;
  estadoOpen = false;
  estadoTarget: RequerimientoDto | null = null;
  nuevoEstado = '';

  readonly estados = ['PENDIENTE','APROBADO','ATENDIDO','ANULADO'];

  form = {
    idObra: null as number | null,
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
    this.api.get<ItemDto[]>('/inventario/items', { soloActivos: true }).subscribe({
      next: (d) => (this.items = d || []),
      error: () => (this.items = []),
    });
  }

  obraNombre(idObra: number): string {
    return this.obras.find((o) => o.idObra === idObra)?.nombre || `Obra #${idObra}`;
  }

  itemNombre(idItem: number): string {
    return this.items.find((i) => i.idItem === idItem)?.descripcion || `Item #${idItem}`;
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<RequerimientoDto[]>('/logistica/requerimientos').subscribe({
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

  removeRow(idx: number) {
    this.form.detalle.splice(idx, 1);
    if (this.form.detalle.length === 0) this.addRow();
  }


  openCambiarEstado(row: RequerimientoDto) {
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
    this.api.put<any>(`/logistica/requerimientos/${this.estadoTarget.idRequerimiento}/estado`, { estado }).subscribe({
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
      observacion: this.form.observacion?.trim() || null,
      detalle: det,
      idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
    };

    this.api.post<any>('/logistica/requerimientos', payload).subscribe({
      next: () => {
        this.notify.success('Requerimiento creado.');
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
