import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface UsuarioDto {
  idUsuario: number;
  usuarioLogin: string;
  nombres: string;
  email?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  rows: UsuarioDto[] = [];
  loading = false;
  error: string | null = null;

  modalOpen = false;
  rolesOpen = false;

  editing: UsuarioDto | null = null;
  rolesUser: UsuarioDto | null = null;

  form = {
    usuarioLogin: '',
    nombres: '',
    email: '',
    password: '',
    activo: true,
  };

  roles = {
    MASTER: false,
    LOGISTICA: false,
    OBRAS: false,
    OFICINA_TECNICA: false,
  };

  constructor(private cdr: ChangeDetectorRef,private api: ApiService, private notify: NotifyService) {}

  ngOnInit(): void {
    this.load();
  }
load() {
    this.loading = true;
    this.error = null;
    this.api.get<UsuarioDto[]>('/seguridad/usuarios').subscribe({
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
    this.editing = null;
    this.form = { usuarioLogin: '', nombres: '', email: '', password: '', activo: true };
    this.modalOpen = true;
  }

  openEdit(row: UsuarioDto) {
    this.editing = row;
    this.form = {
      usuarioLogin: row.usuarioLogin,
      nombres: row.nombres,
      email: row.email || '',
      password: '',
      activo: row.activo,
    };
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.editing = null;
    // force rerender to ensure modal overlay closes
    setTimeout(() => this.forceRender(), 0);
  }

  save() {
    this.error = null;

    if (!this.form.nombres.trim()) {
      this.error = 'Nombres es obligatorio.';
      return;
    }

    if (!this.editing) {
      if (!this.form.usuarioLogin.trim()) {
        this.error = 'Usuario login es obligatorio.';
        return;
      }

      if (!this.form.password.trim()) {
        this.error = 'Contraseña es obligatoria.';
        return;
      }

      const payload = {
        usuarioLogin: this.form.usuarioLogin.trim(),
        nombres: this.form.nombres.trim(),
        email: this.form.email?.trim() || null,
        password: this.form.password.trim(),
      };

      this.api.post<any>('/seguridad/usuarios', payload).subscribe({
        next: () => {
          this.notify.success('Usuario creado.');
          this.closeModal();
          this.load();
        },
        error: (e) => {
          this.error = e?.message || 'No se pudo crear.';
          this.notify.error(this.error);
        },
      });
      return;
    }

    const payload = {
      nombres: this.form.nombres.trim(),
      email: this.form.email?.trim() || null,
      activo: !!this.form.activo,
    };

    this.api.put<any>(`/seguridad/usuarios/${this.editing.idUsuario}`, payload).subscribe({
      next: () => {
        this.notify.success('Usuario actualizado.');
        this.closeModal();
        this.load();
      },
      error: (e) => {
        this.error = e?.message || 'No se pudo actualizar.';
        this.notify.error(this.error);
      },
    });
  }

  openRoles(row: UsuarioDto) {
    this.rolesUser = row;
    this.roles = { MASTER: false, LOGISTICA: false, OBRAS: false, OFICINA_TECNICA: false };
    this.rolesOpen = true;

    // GET roles del usuario (API: /api/seguridad/usuarios/{id}/roles)
    this.api.get<string[]>(`/seguridad/usuarios/${row.idUsuario}/roles`).subscribe({
      next: (d) => {
        const set = new Set((d || []).map((x) => String(x).trim().toUpperCase()));
        this.roles.MASTER = set.has('MASTER');
        this.roles.LOGISTICA = set.has('LOGISTICA');
        this.roles.OBRAS = set.has('OBRAS');
        this.roles.OFICINA_TECNICA = set.has('OFICINA_TECNICA');
        this.forceRender();
      },
      error: () => {
        // Si falla, no rompe UI: queda sin checks
      },
    });
  }

  closeRoles() {
    this.rolesOpen = false;
    this.rolesUser = null;
    setTimeout(() => this.forceRender(), 0);
  }

  saveRoles() {
    if (!this.rolesUser) return;
    const roles: string[] = [];
    if (this.roles.MASTER) roles.push('MASTER');
    if (this.roles.LOGISTICA) roles.push('LOGISTICA');
    if (this.roles.OBRAS) roles.push('OBRAS');
    if (this.roles.OFICINA_TECNICA) roles.push('OFICINA_TECNICA');

    this.api.post<any>(`/seguridad/usuarios/${this.rolesUser.idUsuario}/roles`, { roles }).subscribe({
      next: () => {
        this.notify.success('Roles actualizados.');
        this.closeRoles();
      },
      error: (e) => {
        const msg = e?.message || 'No se pudo asignar roles.';
        this.notify.error(msg);
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
