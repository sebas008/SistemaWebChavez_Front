import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface ObraDto {
  idObra: number;
  codigo: string;
  nombre: string;
  activa: boolean;
}

interface AlmacenDto {
  idAlmacen: number;
  tipo: string;
  idObra?: number | null;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './almacen.html',
  styleUrl: './almacen.scss',
})
export class Almacen implements OnInit {
  rows: AlmacenDto[] = [];
  obras: ObraDto[] = [];

  loading = false;
  error: string | null = null;

  modalOpen = false;
  editing: AlmacenDto | null = null;

  form = {
    tipo: 'INTERNO',
    idObra: null as number | null,
    codigo: '',
    nombre: '',
    activo: true,
  };

  constructor(private cdr: ChangeDetectorRef,private api: ApiService, private notify: NotifyService) {}

  ngOnInit(): void {
    this.loadAll();
  }


  loadAll() {
    this.loadObras();
    this.load();
  }

  loadObras() {
    this.api.get<ObraDto[]>('/maestros/obras', { soloActivas: true }).subscribe({
      next: (d) => (this.obras = d || []),
      error: () => (this.obras = []),
    });
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<AlmacenDto[]>('/inventario/almacenes').subscribe({
      next: (data) => {
        this.rows = data || [];
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
    this.editing = null;
    this.form = { tipo: 'INTERNO', idObra: null, codigo: '', nombre: '', activo: true };
    this.modalOpen = true;
  }

  openEdit(row: AlmacenDto) {
    this.editing = row;
    this.form = {
      tipo: row.tipo,
      idObra: row.idObra ?? null,
      codigo: row.codigo,
      nombre: row.nombre,
      activo: row.activo,
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editing = null;
    setTimeout(() => this.forceRender(), 0);
  }

  save() {
    this.error = null;

    if (!this.form.nombre.trim()) {
      this.error = 'Nombre es obligatorio.';
      return;
    }

    if (!this.editing) {
      if (!this.form.codigo.trim()) {
        this.error = 'Código es obligatorio.';
        return;
      }
      if (this.form.tipo === 'OBRA' && !this.form.idObra) {
        this.error = 'Selecciona una obra.';
        return;
      }

      const codigo = this.form.codigo.trim().toUpperCase();
      const exists = (this.rows || []).some(x => (x.codigo || '').toUpperCase() === codigo && (x.tipo || '').toUpperCase() === (this.form.tipo || '').toUpperCase());
      if (exists) {
        this.error = 'El código de almacén ya existe.';
        this.notify.error(this.error);
        return;
      }

      const payload = {
        tipo: this.form.tipo,
        idObra: this.form.tipo === 'OBRA' ? this.form.idObra : null,
        codigo: codigo,
        nombre: this.form.nombre.trim(),
      };

      this.api.post<any>('/inventario/almacenes', payload).subscribe({
        next: () => {
          this.notify.success('Almacén guardado.');
          this.closeModal();
          this.load();
        },
        error: (e) => {
          this.error = e?.message || 'No se pudo guardar.';
          this.notify.error(this.error);
        },
      });
      return;
    }

    const payload = {
      nombre: this.form.nombre.trim(),
      activo: !!this.form.activo,
    };

    this.api.put<any>(`/inventario/almacenes/${this.editing.idAlmacen}`, payload).subscribe({
      next: () => {
        this.notify.success('Almacén actualizado.');
        this.closeModal();
        this.load();
      },
      error: (e) => {
        this.error = e?.message || 'No se pudo actualizar.';
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
