import { SnackbarService } from '../services/snackbar-service.service';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { MasterDataService } from '../services/master-data.service';
import { inject } from '@angular/core';
import { UserRole } from '@libs/api-client';

export const inpatientGuard: CanActivateFn = (next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot) => {
  const masterService = inject(MasterDataService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);
  const selectedPatient = masterService.selectedPatientSubject$.value;

  if (!selectedPatient) {
    snackbar.show('You need to select a patient first', 'error-snackbar');
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
