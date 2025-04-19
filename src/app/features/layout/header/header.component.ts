import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { toSignal } from '@angular/core/rxjs-interop';

import { ResponsiveService } from '@core/services/responsive.service';
import { SidebarStateService } from '@core/services/sidebar-state.service';
import { MasterDataService } from '@core/services/master-data.service';
import { TranslocoModule } from '@jsverse/transloco';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
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
  private readonly sidebarState = inject(SidebarStateService);
  private readonly responsiveService = inject(ResponsiveService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly router = inject(Router);

  // Protected signals and computed values
  protected readonly isDarkMode = signal(false);
  protected readonly isSmallScreen = this.responsiveService.isSmallScreen;
  protected readonly user = toSignal(this.masterDataService.userSubject);


  // Protected methods (used in template)
  protected toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  protected toggleTheme(): void {
    this.isDarkMode.update(dark => !dark);
    document.body.classList.toggle('dark', this.isDarkMode());
    
  }

  protected logout(): void {
    localStorage.removeItem('accessToken');
    this.masterDataService.userSubject.next(null);
    void this.router.navigate(['/login']);
  }
}

