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
interface ProveedorDto {
  idProveedor: number;
  razonSocial: string;
  activo: boolean;
}
interface ItemDto {
  idItem: number;
  descripcion: string;
}

interface CompraDetalleDto {
  idItem: number;
  cantidad: number;
  precioUnitario: number;
  observacion?: string | null;
}

interface CompraDto {
  idCompra: number;
  codigo: string;
  fecha: string;
  idProveedor: number;
  idObra: number;
  estado: string;
  observacion?: string | null;
  detalle: CompraDetalleDto[];
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './compras.html',
  styleUrl: './compras.scss',
})
export class Compras implements OnInit {
  rows: CompraDto[] = [];
  obras: ObraDto[] = [];
  proveedores: ProveedorDto[] = [];
  items: ItemDto[] = [];

  loading = false;
  error: string | null = null;

  modalOpen = false;
  estadoOpen = false;
  estadoTarget: CompraDto | null = null;
  nuevoEstado = '';

  readonly estados = ['GENERADA','ENVIADA','RECIBIDA','ANULADA'];
  form = {
    idProveedor: null as number | null,
    idObra: null as number | null,
    observacion: '',
    detalle: [{ idItem: 0, cantidad: 1, precioUnitario: 0, observacion: '' }] as Array<{
      idItem: number;
      cantidad: number;
      precioUnitario: number;
      observacion?: string;
    }>,
  };

  constructor(private cdr: ChangeDetectorRef,private api: ApiService, private notify: NotifyService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  /**
   * Compat: el template usa (click)="loadAll()" en el botón "Actualizar".
   * Este alias evita error de compilación y refresca la grilla.
   */
  loadAll(): void {
    this.load();
  }


  private loadLookups() {
    this.api.get<ObraDto[]>('/maestros/obras', { soloActivas: true }).subscribe({
      next: (d) => (this.obras = d || []),
      error: () => (this.obras = []),
    });
    this.api.get<ProveedorDto[]>('/maestros/proveedores', { soloActivos: true }).subscribe({
      next: (d) => (this.proveedores = d || []),
      error: () => (this.proveedores = []),
    });
    this.api.get<ItemDto[]>('/inventario/items', { soloActivos: true }).subscribe({
      next: (d) => (this.items = d || []),
      error: () => (this.items = []),
    });
  }

  obraNombre(id: number): string {
    return this.obras.find((o) => o.idObra === id)?.nombre || `Obra #${id}`;
  }
  provNombre(id: number): string {
    return this.proveedores.find((p) => p.idProveedor === id)?.razonSocial || `Proveedor #${id}`;
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<CompraDto[]>('/logistica/compras').subscribe({
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
      idProveedor: this.proveedores[0]?.idProveedor ?? null,
      idObra: this.obras[0]?.idObra ?? null,
      observacion: '',
      detalle: [{ idItem: this.items[0]?.idItem ?? 0, cantidad: 1, precioUnitario: 0, observacion: '' }],
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    setTimeout(() => this.forceRender(), 0);
  }

  addRow() {
    this.form.detalle.push({ idItem: this.items[0]?.idItem ?? 0, cantidad: 1, precioUnitario: 0, observacion: '' });
  }

  removeRow(i: number) {
    this.form.detalle.splice(i, 1);
    if (this.form.detalle.length === 0) this.addRow();
  }


  openCambiarEstado(row: CompraDto) {
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
    this.api.put<any>(`/logistica/compras/${this.estadoTarget.idCompra}/estado`, { estado }).subscribe({
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
    if (!this.form.idProveedor) {
      this.error = 'Selecciona un proveedor.';
      return;
    }

    const det = (this.form.detalle || [])
      .filter((x) => !!x.idItem && Number(x.cantidad) > 0)
      .map((x) => ({
        idItem: Number(x.idItem),
        cantidad: Number(x.cantidad),
        precioUnitario: Number(x.precioUnitario),
        observacion: x.observacion?.trim() || null,
      }));

    if (det.length === 0) {
      this.error = 'Agrega al menos 1 ítem.';
      return;
    }

    const payload = {
      idProveedor: Number(this.form.idProveedor),
      idObra: Number(this.form.idObra),
      observacion: this.form.observacion?.trim() || null,
      detalle: det,
      idUsuario: this.auth.getSession()?.usuario?.idUsuario ?? null,
    };

    this.api.post<any>('/logistica/compras', payload).subscribe({
      next: () => {
        this.notify.success('Compra creada.');
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
