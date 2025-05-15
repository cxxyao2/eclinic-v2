import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private snackbarSubject = new Subject<{ message: string; panelClass: string }>();
  private destroyRef = inject(DestroyRef);

  constructor(private snackBar: MatSnackBar) {
    this.snackbarSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message, panelClass }) => {
        this.snackBar.open(message, 'Close', {
          duration: 3000, // Duration in milliseconds
          panelClass: [panelClass], // Custom styling
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      });
  }

  // Method to trigger a snackbar message
  show(message: string, panelClass: string = 'success-snackbar') {
    this.snackbarSubject.next({ message, panelClass });
  }
}
