import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Normaliza respuestas del API.
   * Soporta respuestas directas (array/obj) y wrappers comunes: {data}, {items}, {result}, {value}.
   */
  private unwrap<T>(res: any): T {
    if (res === null || res === undefined) return res as T;
    if (Array.isArray(res)) return res as T;
    if (typeof res === 'object') {
      const keys = ['data', 'items', 'result', 'value'];
      for (const k of keys) {
        if (k in res) return (res as any)[k] as T;
      }
    }
    return res as T;
  }

  get<T>(path: string, params?: Record<string, any>): Observable<T> {
    let hp = new HttpParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        hp = hp.set(k, String(v));
      }
    }
    return this.http
      .get<any>(this.base + path, { params: hp })
      .pipe(map((r) => this.unwrap<T>(r)), catchError(this.handle));
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http
      .post<any>(this.base + path, body)
      .pipe(map((r) => this.unwrap<T>(r)), catchError(this.handle));
  }

  put<T>(path: string, body: any): Observable<T> {
    return this.http
      .put<any>(this.base + path, body)
      .pipe(map((r) => this.unwrap<T>(r)), catchError(this.handle));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<any>(this.base + path)
      .pipe(map((r) => this.unwrap<T>(r)), catchError(this.handle));
  }

  private handle(err: HttpErrorResponse) {
    const msg = err?.error?.message || err?.error || err.message || 'Error de conexión';
    return throwError(() => new Error(typeof msg === 'string' ? msg : 'Error de conexión'));
  }
}
