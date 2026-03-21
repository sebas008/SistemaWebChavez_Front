import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { ApiService } from '../../core/services/api';
import { NotifyService } from '../../core/services/notify';

interface ObraDto { idObra: number; codigo: string; nombre: string; activa: boolean; }

@Component({ selector:'app-obras', standalone:true, imports:[FormsModule,NgFor,NgIf], templateUrl:'./obras.html', styleUrl:'./obras.scss' })
export class Obras implements OnInit {
  rows: ObraDto[] = []; loading=false; error:string|null=null; modalOpen=false; editing:ObraDto|null=null;
  form={ codigo:'', nombre:'', activa:true };
  constructor(private cdr:ChangeDetectorRef, private api:ApiService, private notify:NotifyService){}
  ngOnInit(){ this.load(); }
  load(){ this.loading=true; this.error=null; this.api.get<ObraDto[]>('/maestros/obras',{soloActivas:null as any}).subscribe({next:d=>{this.rows=(d||[]).map(x=>({...x,activa:x?.activa!==false}));this.loading=false;this.render();},error:e=>{this.loading=false;this.error=e?.message||'No se pudo cargar.';this.notify.error(this.error);this.render();}}); }
  openNew(){ this.editing=null; this.form={codigo:'',nombre:'',activa:true}; this.modalOpen=true; }
  openEdit(r:ObraDto){ this.editing=r; this.form={codigo:r.codigo,nombre:r.nombre,activa:r.activa}; this.modalOpen=true; }
  closeModal(){ this.modalOpen=false; this.editing=null; this.render(); }
  save(){ this.error=null; const codigo=this.form.codigo.trim().toUpperCase(); const nombre=this.form.nombre.trim(); if(!codigo){this.error='Código es obligatorio.';return;} if(!nombre){this.error='Nombre es obligatorio.';return;} if(!this.editing){ this.api.post('/maestros/obras',{codigo,nombre}).subscribe({next:()=>{this.notify.success('Obra guardada.');this.closeModal();this.load();},error:e=>{this.error=e?.message||'No se pudo guardar.';this.notify.error(this.error);}}); return;} this.api.put(`/maestros/obras/${this.editing.idObra}`,{codigo,nombre,activa:!!this.form.activa}).subscribe({next:()=>{this.notify.success('Obra actualizada.');this.closeModal();this.load();},error:e=>{this.error=e?.message||'No se pudo actualizar.';this.notify.error(this.error);}}); }
  isActive(row: ObraDto){ return row?.activa !== false; }
  private render(){ try{this.cdr.detectChanges();}catch{} }
}

