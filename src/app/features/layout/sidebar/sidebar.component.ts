import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarStateService } from '@core/services/sidebar-state.service';
import { ResponsiveService } from '@core/services/responsive.service';
import { MenuItemComponent } from "../menu-item/menu-item.component";
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MenuItem } from '../menu-item';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  host: {
    'class': 'fixed  md:relative md:flex z-10  transition-transform duration-300 ease-in-out md:translate-x-0',
    'style': `
      left: 0;
      --header-height: 56px;
      border-right: 2px solid var(--mat-sys-outline-variant);
      @media (min-width: 600px) {
        --header-height: 64px;
      }
      top: var(--header-height);
      height: calc(100vh - var(--header-height));
      background-color: var(--mat-sys-surface-container);
    `,
    '[class.translate-x-0]': 'sidebarState.isOpen() || !isSmallScreen()',
    '[class.-translate-x-full]': '!sidebarState.isOpen() && !!isSmallScreen()',
  },
  imports: [
    RouterModule,
    CommonModule,
    MenuItemComponent,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    TranslocoModule
  ]
})
export class SidebarComponent {
  protected readonly sidebarState = inject(SidebarStateService);
  protected readonly isSmallScreen = inject(ResponsiveService).isSmallScreen;
  protected readonly showLabels = signal(true);
  protected readonly menuItems = signal<MenuItem[]>([
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: 'dashboard'
    },
    {
      icon: 'event_available',
      label: 'Available',
      route: 'available',
    },
    {
      icon: "book_online",
      label: 'Booking',
      route: 'booking'
    },
    {
      icon: 'person_check',
      label: 'Check In',
      route: 'checkin'
    },
    {
      icon: 'medication',
      label: 'Consultation',
      route: 'consultation'
    },
    {
      icon: "hub",
      label: "Admin",
      subItems: [
        {
          icon: 'admin_panel_settings',
          label: 'User Authorization',
          route: 'admin'
        },
        {
          icon: 'history_toggle_off',
          label: 'User Login History',
          route: 'admin'
        },
      ]
    },
    {
      icon: 'vaccines',
      label: 'Inpatient',
      route: 'admission'
    }

  ]);


  protected toggleLabels(): void {
    this.showLabels.update(value => !value);
  }
}





