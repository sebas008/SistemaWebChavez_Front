import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api';

type Indicadores = { entregaCompleta:number; entregaATiempo:number; compra:number; almacenInterno:number; };

@Component({ selector:'app-dashboard', standalone:true, imports:[CommonModule], templateUrl:'./dashboard.html', styleUrl:'./dashboard.scss' })
export class Dashboard implements OnInit {
  loading=false; error:string|null=null; indicadores:Indicadores={entregaCompleta:0,entregaATiempo:0,compra:0,almacenInterno:0};
  constructor(private cdr:ChangeDetectorRef, private api:ApiService){}
  ngOnInit(){ this.load(); }
  load(){ this.loading=true; this.error=null; this.api.get<any>('/dashboard/indicadores-requerimientos').subscribe({next:d=>{this.indicadores={entregaCompleta:Number(d?.entregaCompleta ?? d?.EntregaCompleta ?? 0),entregaATiempo:Number(d?.entregaATiempo ?? d?.EntregaATiempo ?? 0),compra:Number(d?.compra ?? d?.Compra ?? 0),almacenInterno:Number(d?.almacenInterno ?? d?.AlmacenInterno ?? 0)};this.loading=false;this.r();},error:e=>{this.loading=false;this.error=e?.message||'No se pudo cargar el dashboard.';this.r();}});} private r(){try{this.cdr.detectChanges();}catch{}}
}
