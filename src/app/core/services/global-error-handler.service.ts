import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { SnackbarService } from './snackbar-service.service';


@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private readonly zone: NgZone,
    private readonly snackbar: SnackbarService
  ) { }

  handleError(error: unknown): void {
    // Run inside NgZone to ensure UI updates
    this.zone.run(() => {
      // Log the error for debugging
      console.error('Uncaught error:', error);

      // Show a generic message to the user
      this.snackbar.show('An unexpected error occurred. Our team has been notified.');

      // Here you could also send the error to a logging service
      // this.loggingService.logError(error);
    });
  }
}