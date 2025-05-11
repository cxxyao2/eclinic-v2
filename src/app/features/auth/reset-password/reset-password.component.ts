import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@libs/api-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent {
  // Public signals
  public readonly message = signal<string>('');
  public readonly isError = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);

  // Public form
  public readonly resetForm = this.buildForm();

  // Private dependencies
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly token = this.route.snapshot.queryParams['token'];

  constructor() {
    if (!this.token) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Handles form submission
   */
  public onSubmit(): void {
    if (this.resetForm.valid && !this.isLoading()) {
      this.resetPassword();
    }
  }

  /**
   * Builds the reset password form with validation
   */
  private buildForm() {
    return this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      return { mismatch: true };
    }
    return null;
  }

  /**
   * Sends password reset request to the backend
   */
  private resetPassword(): void {
    this.isLoading.set(true);

    this.authService.apiAuthResetPasswordPost({
      token: this.token,
      newPassword: this.resetForm.value.newPassword!,
      confirmPassword: this.resetForm.value.confirmPassword!
    }).pipe(
      takeUntilDestroyed()
    ).subscribe({
      next: () => {
        this.message.set('Password reset successful');
        this.isError.set(false);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (error) => {
        this.message.set(error.error?.message || 'Failed to reset password. Please try again.');
        this.isError.set(true);
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}
