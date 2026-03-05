import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(private auth: AuthService, private router: Router) {}

  get usuario() {
    return this.auth.getSession()?.usuario;
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
