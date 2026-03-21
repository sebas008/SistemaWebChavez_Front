import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface UnidadMedidaDto {
  idUnidadMedida: number;
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-unidad-medida',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './unidad-medida.html',
  styleUrl: './unidad-medida.scss',
})
export class UnidadMedida implements OnInit {
  rows: UnidadMedidaDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: UnidadMedidaDto | null = null;
  form = { codigo: '', nombre: '' };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<UnidadMedidaDto[]>('/maestros/unidades-medida').subscribe({
      next: (data) => { this.rows = data || []; this.loading = false; this.forceRender(); },
      error: (e) => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.forceRender(); },
    });
  }

  openNew() { this.editing = null; this.form = { codigo: '', nombre: '' }; this.modalOpen = true; }
  openEdit(row: UnidadMedidaDto) { this.editing = row; this.form = { codigo: row.codigo, nombre: row.nombre }; this.modalOpen = true; }
  closeModal() { this.modalOpen = false; this.editing = null; setTimeout(() => this.forceRender(), 0); }

  save() {
    this.error = null;
    if (!this.form.nombre.trim()) { this.error = 'Nombre es obligatorio.'; return; }

    if (!this.editing) {
      if (!this.form.codigo.trim()) { this.error = 'Código es obligatorio.'; return; }
      const payload = { codigo: this.form.codigo.trim().toUpperCase(), nombre: this.form.nombre.trim() };
      this.api.post<any>('/maestros/unidades-medida', payload).subscribe({
        next: () => { this.notify.success('Unidad de medida guardada.'); this.closeModal(); this.load(); },
        error: (e) => { this.error = e?.message || 'No se pudo guardar.'; this.notify.error(this.error); },
      });
      return;
    }

    const payload = { nombre: this.form.nombre.trim() };
    this.api.put<any>(`/maestros/unidades-medida/${this.editing.idUnidadMedida}`, payload).subscribe({
      next: () => { this.notify.success('Unidad de medida actualizada.'); this.closeModal(); this.load(); },
      error: (e) => { this.error = e?.message || 'No se pudo actualizar.'; this.notify.error(this.error); },
    });
  }

  private forceRender() { try { this.cdr.detectChanges(); setTimeout(() => { try { this.cdr.detectChanges(); } catch {} }, 0); } catch {} }
}
