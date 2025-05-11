import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { SidebarStateService } from '@core/services/sidebar-state.service';
import { MasterDataService } from '@core/services/master-data.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ThemeService } from '@core/services/theme.service';
import { UserRole } from '@libs/api-client';
import { SseClientService } from '@core/services/sse.service';
import { DialogSimpleDialog } from '@shared/components/dialog/dialog-simple-dialog';
import { filter, tap } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

// Application imports - Models
const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  fr: 'French',
  ch: 'Chinese',
  jp: 'Japanese'
} as const;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    TranslocoModule
  ],
  providers: [
    SseClientService
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  public readonly sseService = inject(SseClientService);

  // Private service injections
  private readonly transloco = inject(TranslocoService);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  // Make UserRole available to the template
  protected readonly UserRole = UserRole;

  // Protected signals and computed values
  protected readonly isDarkMode = this.themeService.isDarkMode;
  protected readonly user = toSignal(this.masterDataService.userSubject$);
  protected readonly currentLanguage = signal('EN');


  // Protected methods (used in template)
  protected toggleLanguage(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.currentLanguage.set(lang.toUpperCase());
  }

  protected toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected logout(): void {
    localStorage.removeItem('accessToken');
    this.masterDataService.userSubject$.next(null);
    this.router.navigate(['/login']);
  }

  protected showNotifications(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.position = {
      top: '64px',
      right: '0px'
    };
    dialogConfig.width = '300px';
    dialogConfig.height = '400px';
    dialogConfig.data = {
      title: 'Patient need a bed',
      content: [...this.sseService.message()],
      isCancelButtonVisible: true,
      optionId: 'inpatientId',
      optionValue: 'patientName'
    };

    const dialogRef = this.dialog.open(DialogSimpleDialog, dialogConfig);
    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(),
      filter((result): result is object => typeof result === 'object' && !!result),
      tap(result => {
        this.masterDataService.selectedPatientSubject$.next(result);
        this.router.navigate(['/inpatient']);
      })
    ).subscribe();
  }
}

