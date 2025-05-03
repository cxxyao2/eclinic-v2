import { SnackbarService } from '../services/snackbar-service.service';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { MasterDataService } from '../services/master-data.service';
import { inject } from '@angular/core';
import { UserRole } from '@libs/api-client';
import { map } from 'rxjs';
import { User } from '@libs/api-client';

const isAdmin = (user: User | null): boolean => {
  return user?.role === UserRole.Admin;
};

export const adminGuard: CanActivateFn = (next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot) => {
  const masterService = inject(MasterDataService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  const user = masterService.userSubject$.value;

  if (user && !isAdmin(user)) {
    snackbar.show('You are not admin', 'error-snackbar');
    return false;
  }

  return masterService.validateTokenAndFetchUser().pipe(
    map(user => {
      if (!user) {
        snackbar.show('You need to login first', 'error-snackbar');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      if (user && !isAdmin(user)) {
        snackbar.show('You are not admin', 'error-snackbar');
        return false;
      }

      return true;
    })
  );
};
