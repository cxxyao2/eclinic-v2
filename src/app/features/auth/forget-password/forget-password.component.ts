import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '@libs/api-client';
import { signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgetPasswordComponent {
  // Public properties
  public readonly forgotPasswordForm = this.buildForm();
  public readonly message = signal<string>('');
  public readonly isError = signal<boolean>(false);

  // Private dependencies
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authService = inject(AuthService);

  /**
   * Handles form submission
   */
  public onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.requestPasswordReset(this.forgotPasswordForm.value.email!);
    }
  }

  /**
   * Builds the forgot password form
   */
  private buildForm() {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Sends password reset request to the backend
   */
  private requestPasswordReset(email: string): void {
    this.authService.apiAuthRequestPasswordResetPost({ email }).subscribe({
      next: () => {
        this.message.set('Password reset link has been sent to your email');
        this.isError.set(false);
      },
      error: (error) => {
        this.message.set(error.error?.message || 'Failed to send reset link. Please try again.');
        this.isError.set(true);
      }
    });
  }
}
