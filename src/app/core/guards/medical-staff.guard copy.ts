import { SnackbarService } from '../services/snackbar-service.service';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { MasterDataService } from '../services/master-data.service';
import { inject } from '@angular/core';
import { UserRole } from '@libs/api-client';

export const medicalStaffGuard: CanActivateFn = (next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot) => {
  const masterService = inject(MasterDataService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);
  const user = masterService.userSubject.value;

  if (!user) {
    snackbar.show('You need to login first', 'error-snackbar');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (user.role === UserRole.Nurse || user.role === UserRole.Practitioner || user.role === UserRole.Admin) {
    return true;
  }
  snackbar.show('You are not medical staff', 'error-snackbar');
  return false;
};
