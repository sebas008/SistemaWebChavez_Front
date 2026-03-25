import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';
import { OnlyDigitsDirective } from '../../shared/directives/only-digits.directive';

interface ProveedorDto {
  idProveedor: number;
  ruc?: string | null;
  razonSocial: string;
  email?: string | null;
  telefono?: string | null;
  activo: boolean;
}

@Component({
  selector: 'app-proveedor',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, OnlyDigitsDirective],
  templateUrl: './proveedor.html',
  styleUrl: './proveedor.scss',
})
export class Proveedor implements OnInit {
  rows: ProveedorDto[] = [];
  loading = false;
  error: string | null = null;
  modalOpen = false;
  editing: ProveedorDto | null = null;

  form = {
    ruc: '',
    razonSocial: '',
    email: '',
    telefono: '',
    activo: true,
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private notify: NotifyService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.api.get<ProveedorDto[]>('/maestros/proveedores').subscribe({
      next: (data) => {
        this.rows = data || [];
        this.loading = false;
        this.forceRender();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.message || 'No se pudo cargar.';
        this.forceRender();
      },
    });
  }

  openNew() {
    this.editing = null;
    this.form = { ruc: '', razonSocial: '', email: '', telefono: '', activo: true };
    this.modalOpen = true;
  }

  openEdit(row: ProveedorDto) {
    this.editing = row;
    this.form = {
      ruc: row.ruc || '',
      razonSocial: row.razonSocial || '',
      email: row.email || '',
      telefono: row.telefono || '',
      activo: row.activo,
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editing = null;
    setTimeout(() => this.forceRender(), 0);
  }

  private onlyDigits(v: string | null | undefined): string {
    return (v ?? '').toString().replace(/\D+/g, '');
  }

  onRucInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const clean = this.onlyDigits(el.value).slice(0, 11);
    el.value = clean;
    this.form.ruc = clean;
  }

  onTelefonoInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const clean = this.onlyDigits(el.value).slice(0, 15);
    el.value = clean;
    this.form.telefono = clean;
  }

  onRazonSocialInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    this.form.razonSocial = el.value;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  save() {
    this.error = null;

    if (!this.form.razonSocial.trim()) {
      this.error = 'Razón social / nombre comercial es obligatoria.';
      return;
    }

    const rucDigits = this.onlyDigits(this.form.ruc || '');
    if (this.form.ruc && rucDigits.length !== 11) {
      this.error = 'El RUC debe tener 11 dígitos.';
      return;
    }
    this.form.ruc = rucDigits;

    const telDigits = this.onlyDigits(this.form.telefono || '');
    if (this.form.telefono && telDigits.length < 6) {
      this.error = 'Teléfono inválido.';
      return;
    }
    this.form.telefono = telDigits;

    const email = (this.form.email || '').trim();
    if (email && !this.isValidEmail(email)) {
      this.error = 'Email inválido.';
      return;
    }

    if (!this.editing) {
      const payload = {
        ruc: this.form.ruc?.trim() || null,
        razonSocial: this.form.razonSocial.trim(),
        email: this.form.email?.trim() || null,
        telefono: this.form.telefono?.trim() || null,
      };
      this.api.post<any>('/maestros/proveedores', payload).subscribe({
        next: () => {
          this.notify.success('Proveedor guardado.');
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
      ruc: this.form.ruc?.trim() || null,
      razonSocial: this.form.razonSocial.trim(),
      email: this.form.email?.trim() || null,
      telefono: this.form.telefono?.trim() || null,
      activo: !!this.form.activo,
    };

    this.api.put<any>(`/maestros/proveedores/${this.editing.idProveedor}`, payload).subscribe({
      next: () => {
        this.notify.success('Proveedor actualizado.');
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
