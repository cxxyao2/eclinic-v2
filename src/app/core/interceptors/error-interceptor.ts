import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SnackbarService } from '@core/services/snackbar-service.service';

import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackbar = inject(SnackbarService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle HTTP errors (401, 404, 500, etc.)
      if (error.status === 401) {
        router.navigate(['/login']);
        snackbar.show('Your session has expired. Please log in again.');
      } else if (error.status === 403) {
        snackbar.show('You don\'t have permission to access this resource.');
      } else if (error.status === 0) {
        snackbar.show('Cannot connect to the server. Please check your internet connection.');
      } else {
        snackbar.show(error.error?.message || 'An error occurred while processing your request.');
      }
      
      // Log the error for debugging
      console.error('API Error:', error);
      
      // Return the error for component-level handling if needed
      return throwError(() => error);
    })
  );
};