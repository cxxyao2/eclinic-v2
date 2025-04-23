import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { toSignal } from '@angular/core/rxjs-interop';

import { SidebarStateService } from '@core/services/sidebar-state.service';
import { MasterDataService } from '@core/services/master-data.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ThemeService } from '@core/services/theme.service';

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
    TranslocoModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  // Private service injections
  private readonly transloco = inject(TranslocoService);
  private readonly sidebarState = inject(SidebarStateService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  // Protected signals and computed values
  protected readonly isDarkMode = this.themeService.isDarkMode;
  protected readonly user = toSignal(this.masterDataService.userSubject);
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
    this.masterDataService.userSubject.next(null);
     this.router.navigate(['/login']);
  }
}

