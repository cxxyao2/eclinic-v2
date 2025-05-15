import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from '@libs/api-client';
import { CodeInputModule } from 'angular-code-input';

@Component({
  selector: 'app-active-account',
  standalone: true,
  imports: [CodeInputModule],
  templateUrl: './active-account.component.html',
  styleUrl: './active-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveAccountComponent implements OnDestroy {
  // Public signals
  public readonly message = signal<string>('');
  public readonly isOkay = signal<boolean>(true);
  public readonly submitted = signal<boolean>(false);

  // Private dependencies
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly redirectDelay = 2000; // 2 seconds delay
  private redirectTimeout?: number;
  private destroyRef = inject(DestroyRef);

  /**
   * Handles the completion of code input
   * @param token - The activation code entered by the user
   */
  public onCodeCompleted(token: string): void {
    this.confirmAccount(token);
  }

  /**
   * Redirects user to login page
   */
  public redirectToLogin(): void {
    // Clear any existing timeout before redirecting
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
      this.redirectTimeout = undefined;
    }
    this.router.navigate(['login']);
  }

  /**
   * Cleanup resources when component is destroyed
   */
  public ngOnDestroy(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
      this.redirectTimeout = undefined;
    }
  }

  /**
   * Confirms the account activation with the backend
   * @param token - The activation code to be verified
   */
  private confirmAccount(token: string): void {
    this.authService.apiAuthActivatePost({
      code: token
    }).
      pipe(takeUntilDestroyed(this.destroyRef)).
      subscribe({
        next: () => {
          this.message.set('Your account has been successfully activated. \nNow you can proceed to login');
          this.submitted.set(true);
          this.isOkay.set(true);
          this.redirectTimeout = window.setTimeout(() => this.redirectToLogin(), this.redirectDelay);
        },
        error: () => {
          this.message.set('Token has been expired or invalid');
          this.submitted.set(true);
          this.isOkay.set(false);
        }
      });
  }
}
