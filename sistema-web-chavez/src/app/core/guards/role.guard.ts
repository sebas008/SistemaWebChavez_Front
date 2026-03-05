import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Usa route.data['roles'] = ['MASTER','LOGISTICA','OBRAS']
 */
export const roleGuard: CanActivateFn = (_route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const allowed = (_route.data?.['roles'] as string[] | undefined) ?? [];
  if (allowed.length === 0) return true;

  if (auth.hasAnyRole(allowed)) return true;

  router.navigate(['/dashboard']);
  return false;
};
