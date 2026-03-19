import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, NgIf],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Output() navigate = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  onNavigate() {
    this.navigate.emit();
  }

  get isMaster(): boolean {
    return this.auth.hasRole('MASTER');
  }

  get isLogistica(): boolean {
    return this.auth.hasRole('LOGISTICA');
  }

  get isObras(): boolean {
    return this.auth.hasRole('OBRAS');
  }

  get isOficinaTecnica(): boolean {
    return this.auth.hasRole('OFICINA_TECNICA');
  }

  canSeeProveedores(): boolean {
    return this.isMaster;
  }

  canSeeAlmacenes(): boolean {
    return this.isMaster;
  }

  canSeeObras(): boolean {
    return this.isMaster;
  }

  canSeeUnidadesMedida(): boolean {
    return this.isMaster;
  }

  canSeeMateriales(): boolean {
    return this.isMaster || this.isOficinaTecnica;
  }

  canSeePartidas(): boolean {
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
}
