import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface PartidaDto {
  idPartida: number;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-partidas',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './partidas.html',
  styleUrl: './partidas.scss',
})
export class Partidas implements OnInit {
  rows: PartidaDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: PartidaDto | null = null;

  form = {
    nombre: '',
    activo: true,
  };

  constructor(private cdr: ChangeDetectorRef, private api: ApiService, private notify: NotifyService) {}

  ngOnInit(): void { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<PartidaDto[]>('/maestros/partidas').subscribe({
      next: (data) => {
        this.rows = data || [];
        this.loading = false;
        this.forceRender();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.message || 'No se pudo cargar.';
        this.notify.error(this.error);
        this.forceRender();
      },
    });
  }

  openNew() {
    this.editing = null;
    this.form = { nombre: '', activo: true };
    this.modalOpen = true;
  }

  openEdit(row: PartidaDto) {
    this.editing = row;
    this.form = { nombre: row.nombre, activo: row.activo };
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
      this.api.post<any>('/maestros/partidas', { nombre: this.form.nombre.trim() }).subscribe({
        next: () => {
          this.notify.success('Partida guardada.');
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

    this.api.put<any>(`/maestros/partidas/${this.editing.idPartida}`, {
      nombre: this.form.nombre.trim(),
      activo: !!this.form.activo,
    }).subscribe({
      next: () => {
        this.notify.success('Partida actualizada.');
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
