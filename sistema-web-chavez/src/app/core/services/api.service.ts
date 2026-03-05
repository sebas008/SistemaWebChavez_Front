import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppSettings } from '../config/app-settings';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = AppSettings.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(this.url(path), { params: httpParams });
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? {}, {
      headers: headers ? new HttpHeaders(headers) : undefined,
    });
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? {});
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${p}`;
  }

  private buildParams(params?: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    if (!params) return hp;

    for (const [k, v] of Object.entries(params)) {
      if (v === null || v === undefined) continue;
      hp = hp.set(k, String(v));
    }

    return hp;
  }
}
