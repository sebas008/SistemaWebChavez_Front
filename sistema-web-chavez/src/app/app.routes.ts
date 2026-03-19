import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { MainLayout } from './layout/main-layout/main-layout';
import { Usuarios } from './features/usuarios/usuarios';
import { Proveedor } from './features/proveedor/proveedor';
import { Partidas } from './features/partidas/partidas';
import { Almacen } from './features/almacen/almacen';
import { Compras } from './features/compras/compras';
import { Requerimientos } from './features/requerimientos/requerimientos';
import { LogisticaInterna } from './features/logistica-interna/logistica-interna';
import { Obras } from './features/obras/obras';
import { UnidadMedida } from './features/unidad-medida/unidad-medida';
import { Materiales } from './features/materiales/materiales';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: Login },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'requerimientos', component: Requerimientos },

      { path: 'usuarios', component: Usuarios, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'proveedores', component: Proveedor, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'partidas', component: Partidas, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'almacenes', component: Almacen, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'obras', component: Obras, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'unidades-medida', component: UnidadMedida, canActivate: [roleGuard], data: { roles: ['MASTER'] } },
      { path: 'materiales', component: Materiales, canActivate: [roleGuard], data: { roles: ['MASTER', 'OFICINA_TECNICA'] } },

      { path: 'compras', component: Compras, canActivate: [roleGuard], data: { roles: ['MASTER', 'LOGISTICA'] } },
      { path: 'logistica-interna', pathMatch: 'full', redirectTo: 'almacen-interno' },
      { path: 'almacen-interno', component: LogisticaInterna, canActivate: [roleGuard], data: { roles: ['MASTER', 'LOGISTICA'] } },

      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
