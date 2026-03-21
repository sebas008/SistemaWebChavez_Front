import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface UnidadDto {
  idUnidadMedida: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-unidades-medida',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './unidades-medida.html',
  styleUrl: './unidades-medida.scss',
})
export class UnidadesMedida implements OnInit {
  rows: UnidadDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: UnidadDto | null = null;
  form = { codigo: '', nombre: '', activo: true };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<UnidadDto[]>('/maestros/unidades-medida').subscribe({
      next: (d) => { this.rows = (d || []).map((x:any) => ({ ...x, activo: x?.activo !== false })); this.loading = false; this.forceRender(); },
      error: (e) => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.forceRender(); }
    });
  }

  openNew() {
    this.editing = null;
    this.form = { codigo: '', nombre: '', activo: true };
    this.modalOpen = true;
  }

  openEdit(row: UnidadDto) {
    this.editing = row;
    this.form = { codigo: row.codigo, nombre: row.nombre, activo: row.activo };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editing = null;
    setTimeout(() => this.forceRender(), 0);
  }

  save() {
    if (!this.form.codigo.trim()) { this.notify.error('Código es obligatorio.'); return; }
    if (!this.form.nombre.trim()) { this.notify.error('Nombre es obligatorio.'); return; }

    const payload = { codigo: this.form.codigo.trim().toUpperCase(), nombre: this.form.nombre.trim(), activo: !!this.form.activo };

    if (!this.editing) {
      this.api.post('/maestros/unidades-medida', payload).subscribe({
        next: () => { this.notify.success('Unidad guardada.'); this.closeModal(); this.load(); },
        error: (e) => this.notify.error(e?.message || 'No se pudo guardar.')
      });
      return;
    }

    this.api.put(`/maestros/unidades-medida/${this.editing.idUnidadMedida}`, payload).subscribe({
      next: () => { this.notify.success('Unidad actualizada.'); this.closeModal(); this.load(); },
      error: (e) => this.notify.error(e?.message || 'No se pudo actualizar.')
    });
  }

  private forceRender() { try { this.cdr.detectChanges(); } catch {} }
}
