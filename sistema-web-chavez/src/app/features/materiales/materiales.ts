import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';
import { AuthService } from '../../core/services/auth';

interface ItemDto {
  idItem: number;
  partida?: string | null;
  descripcion: string;
  idUnidadMedida?: number | null;
  activo: boolean;
}

interface UnidadMedidaDto {
  idUnidadMedida: number;
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './materiales.html',
  styleUrl: './materiales.scss',
})
export class Materiales implements OnInit {
  rows: ItemDto[] = [];
  unidades: UnidadMedidaDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: ItemDto | null = null;
  form = { partida: '', descripcion: '', idUnidadMedida: null as number | null, activo: true };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService, private auth: AuthService) {}

  canEditMateriales(): boolean {
    return this.auth.hasRole('MASTER') || this.auth.hasRole('OFICINA_TECNICA');
  }

  ngOnInit(): void { this.loadAll(); }

  loadAll() { this.loadUnidades(); this.load(); }

  loadUnidades() {
    this.api.get<UnidadMedidaDto[]>('/maestros/unidades-medida').subscribe({ next: d => this.unidades = d || [], error: () => this.unidades = [] });
  }

  unidadNombre(idUnidadMedida?: number | null): string {
    if (!idUnidadMedida) return '-';
    const row = this.unidades.find(x => x.idUnidadMedida === idUnidadMedida);
    return row ? `${row.codigo} - ${row.nombre}` : `#${idUnidadMedida}`;
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<ItemDto[]>('/inventario/items').subscribe({
      next: (data) => { this.rows = data || []; this.loading = false; this.forceRender(); },
      error: (e) => { this.loading = false; this.error = e?.message || 'No se pudo cargar.'; this.notify.error(this.error); this.forceRender(); },
    });
  }

  openNew() { this.editing = null; this.form = { partida: '', descripcion: '', idUnidadMedida: null, activo: true }; this.modalOpen = true; }

  openEdit(row: ItemDto) { this.editing = row; this.form = { partida: row.partida || '', descripcion: row.descripcion, idUnidadMedida: row.idUnidadMedida ?? null, activo: row.activo }; this.modalOpen = true; }

  closeModal() { this.modalOpen = false; this.editing = null; setTimeout(() => this.forceRender(), 0); }

  save() {
    this.error = null;
    if (!this.form.descripcion.trim()) { this.error = 'Descripción es obligatoria.'; return; }
    if (!this.editing) {
      const payload = { partida: this.form.partida.trim() || null, descripcion: this.form.descripcion.trim(), idUnidadMedida: this.form.idUnidadMedida };
      this.api.post<any>('/inventario/items', payload).subscribe({
        next: () => { this.notify.success('Material guardado.'); this.closeModal(); this.load(); },
        error: (e) => { this.error = e?.message || 'No se pudo guardar.'; this.notify.error(this.error); },
      });
      return;
    }
    const payload = { partida: this.form.partida.trim() || null, descripcion: this.form.descripcion.trim(), idUnidadMedida: this.form.idUnidadMedida, activo: !!this.form.activo };
    this.api.put<any>(`/inventario/items/${this.editing.idItem}`, payload).subscribe({
      next: () => { this.notify.success('Material actualizado.'); this.closeModal(); this.load(); },
      error: (e) => { this.error = e?.message || 'No se pudo actualizar.'; this.notify.error(this.error); },
    });
  }

  private forceRender() { try { this.cdr.detectChanges(); setTimeout(() => { try { this.cdr.detectChanges(); } catch {} }, 0); } catch {} }
}
