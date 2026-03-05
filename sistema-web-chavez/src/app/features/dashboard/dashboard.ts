import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api';
import { AuthService } from '../../core/services/auth';

type Kpis = {
  proveedores: number;
  almacenes: number;
  usuarios: number;
  requerimientos: number;
  compras: number;
  atenciones: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  loading = false;
  error: string | null = null;

  kpis: Kpis = {
    proveedores: 0,
    almacenes: 0,
    usuarios: 0,
    requerimientos: 0,
    compras: 0,
    atenciones: 0,
  };

  constructor(private cdr: ChangeDetectorRef,private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }


  get isMaster(): boolean {
    return this.auth.hasRole('MASTER');
  }
  get isLogistica(): boolean {
    return this.auth.hasRole('LOGISTICA');
  }

  canSeeProveedores(): boolean {
    return this.isMaster;
  }
  canSeeAlmacenes(): boolean {
    return this.isMaster;
  }
  canSeeUsuarios(): boolean {
    return this.isMaster;
  }
  canSeeCompras(): boolean {
    return this.isMaster || this.isLogistica;
  }
  canSeeLogisticaInterna(): boolean {
    return this.isMaster || this.isLogistica;
  }
  canSeeRequerimientos(): boolean {
    return true;
  }

load() {
  this.loading = true;
  this.error = null;

  // Prefer /dashboard/kpis, fallback to /dashboard/resumen
  this.api.get<Kpis>('/dashboard/kpis').pipe(
    catchError(() => this.api.get<Kpis>('/dashboard/resumen')),
    catchError(() => of({
      proveedores: 0,
      almacenes: 0,
      usuarios: 0,
      requerimientos: 0,
      compras: 0,
      atenciones: 0,
    } as Kpis)),
    finalize(() => {
      this.loading = false;
      this.forceRender();
    })
  ).subscribe({
    next: (d) => {
      this.kpis = {
        proveedores: (d as any)?.proveedores ?? (d as any)?.Proveedores ?? 0,
        almacenes: (d as any)?.almacenes ?? (d as any)?.Almacenes ?? 0,
        usuarios: (d as any)?.usuarios ?? (d as any)?.Usuarios ?? 0,
        requerimientos: (d as any)?.requerimientos ?? (d as any)?.Requerimientos ?? 0,
        compras: (d as any)?.compras ?? (d as any)?.Compras ?? 0,
        atenciones: (d as any)?.atenciones ?? (d as any)?.Atenciones ?? 0,
      };
    },
    error: (e) => {
      this.error = e?.message || 'No se pudo cargar el dashboard.';
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
