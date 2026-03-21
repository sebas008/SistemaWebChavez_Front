import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { Observable, tap } from 'rxjs';

export interface LoginRequestDto {
  usuario: string;
  password: string;
}

export interface LoginResponseDto {
  // La API devuelve: IdUsuario, UsuarioLogin, Nombres, Email
  usuario: { idUsuario: number; usuarioLogin: string; nombres?: string | null; email?: string | null };
  roles: Array<{ idRol: number; codigo: string; nombre: string }>;
  permisos: Array<{ idPermiso: number; codigo: string; nombre: string }>;
}

const STORAGE_KEY = 'chavez.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private api: ApiService) {}

  login(req: LoginRequestDto): Observable<LoginResponseDto> {
    // API real: POST /api/auth/login
    return this.api.post<LoginResponseDto>('/auth/login', req).pipe(tap((resp) => this.setSession(resp)));
  }

  logout(): void {
    this.safeRemove(STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getSession();
  }

  getSession(): LoginResponseDto | null {
    const raw = this.safeGet(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /** Roles normalizados (UPPERCASE) */
  getRoleCodes(): string[] {
    const roles = this.getSession()?.roles ?? [];
    return roles
      .map((r) => (r?.codigo ?? '').toString().trim().toUpperCase())
      .filter((x) => !!x);
  }

  hasRole(role: string): boolean {
    const wanted = (role ?? '').toString().trim().toUpperCase();
    if (!wanted) return false;

    const codes = this.getRoleCodes();

    // Compatibilidad: si tu BD usa ADMIN/OPERADOR, esto evita bloquear el menú.
    const aliases: Record<string, string[]> = {
      MASTER: ['MASTER', 'ADMIN', 'ADMINISTRADOR'],
      LOGISTICA: ['LOGISTICA', 'LOGÍSTICA'],
      OBRAS: ['OBRAS'],
      OFICINA_TECNICA: ['OFICINA_TECNICA', 'OFICINA TECNICA', 'OFICINA_TÉCNICA'],
    };

    const candidates = aliases[wanted] ?? [wanted];
    return candidates.some((c) => codes.includes(c));
  }

  hasAnyRole(roles: string[]): boolean {
    return (roles ?? []).some((r) => this.hasRole(r));
  }

  private setSession(resp: LoginResponseDto) {
    this.safeSet(STORAGE_KEY, JSON.stringify(resp));
  }

  // -----------------
  // SSR-safe storage
  // -----------------
  private storageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
      return false;
    }
  }

  private safeGet(key: string): string | null {
    if (!this.storageAvailable()) return null;
    return window.localStorage.getItem(key);
  }

  private safeSet(key: string, value: string): void {
    if (!this.storageAvailable()) return;
    window.localStorage.setItem(key, value);
  }

  private safeRemove(key: string): void {
    if (!this.storageAvailable()) return;
    window.localStorage.removeItem(key);
  }
}
