import { SnackbarService } from '../services/snackbar-service.service';
import {  CanActivateFn, Router } from '@angular/router';
import { MasterDataService } from '../services/master-data.service';
import { inject } from '@angular/core';

export const inpatientGuard: CanActivateFn = () => {
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
