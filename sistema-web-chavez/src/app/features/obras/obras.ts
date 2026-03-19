import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-obras',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './obras.html',
  styleUrl: './obras.scss',
})
export class Obras implements OnInit {
  rows: ObraDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: ObraDto | null = null;
  form = { codigo: '', nombre: '', activa: true };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService) {}
  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<ObraDto[]>('/maestros/obras?soloActivas=true').subscribe({
      next: (data) => { this.rows = data || []; this.loading = false; this.forceRender(); },
      error: (e) => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.forceRender(); },
    });
  }

  openNew() { this.editing = null; this.form = { codigo: '', nombre: '', activa: true }; this.modalOpen = true; }
  openEdit(row: ObraDto) { this.editing = row; this.form = { codigo: row.codigo, nombre: row.nombre, activa: row.activa }; this.modalOpen = true; }
  closeModal() { this.modalOpen = false; this.editing = null; setTimeout(() => this.forceRender(), 0); }

  save() {
    this.error = null;
    if (!this.form.codigo.trim()) { this.error = 'Código es obligatorio.'; return; }
    if (!this.form.nombre.trim()) { this.error = 'Nombre es obligatorio.'; return; }

    const codigo = this.form.codigo.trim().toUpperCase();
    const nombre = this.form.nombre.trim();

    if (!this.editing) {
      this.api.post<any>('/maestros/obras', { codigo, nombre }).subscribe({
        next: () => { this.notify.success('Obra guardada.'); this.closeModal(); this.load(); },
        error: (e) => { this.error = e?.message || 'No se pudo guardar.'; this.notify.error(this.error); },
      });
      return;
    }

    this.api.put<any>(`/maestros/obras/${this.editing.idObra}`, { codigo, nombre, activa: !!this.form.activa }).subscribe({
      next: () => { this.notify.success('Obra actualizada.'); this.closeModal(); this.load(); },
      error: (e) => { this.error = e?.message || 'No se pudo actualizar.'; this.notify.error(this.error); },
    });
  }

  private forceRender() {
    try {
      this.cdr.detectChanges();
      setTimeout(() => { try { this.cdr.detectChanges(); } catch {} }, 0);
    } catch {}
  }
}
