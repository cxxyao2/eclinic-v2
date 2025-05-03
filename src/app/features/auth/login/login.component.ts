import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Services
import { AuthService } from '@libs/api-client';
import { MasterDataService } from '@core/services/master-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  // Dependency Injection using inject function
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly masterService = inject(MasterDataService);

  // Public properties
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly errorMessage = signal<string | null>(null);
  readonly returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  hidePassword = true;
  private readonly destroyRef = inject(DestroyRef);

  // Form submission handler
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.handleLogin(this.loginForm.value as { email: string; password: string });
    }
  }

  // Private methods
  private handleLogin(loginData: { email: string; password: string }): void {
    this.authService.apiAuthLoginPost(loginData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleLoginSuccess(response, loginData.email),
        error: (error: HttpErrorResponse) => this.handleLoginError(error)
      });
  }

  private handleLoginSuccess(response: any, email: string): void {
    localStorage.setItem('accessToken', response.accessToken);
    this.masterService.userSubject$.next(response.user);
    this.errorMessage.set(null);
    this.router.navigateByUrl(this.returnUrl || '/dashboard');

  }

  private handleLoginError(error: HttpErrorResponse): void {
    localStorage.removeItem('accessToken');
    const message = error.error?.message || error.message || "Something went wrong.";
    this.errorMessage.set(message);
    console.error('Login failed:', error);
  }
}
