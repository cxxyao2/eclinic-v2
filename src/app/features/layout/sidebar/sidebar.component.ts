import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarStateService } from '@core/services/sidebar-state.service';
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
    'class': `
    fixed md:sticky    
    top-[56px] md:top-0            
    z-10 md:z-0                   
    transition-transform duration-300  
    border-r border-[var(--mat-sys-outline-variant)]
    bg-[var(--mat-sys-surface-container-lowest)]
    translate-x-[-100%] md:translate-x-0 
    [&.open]:translate-x-0       
    overflow-y-auto                
  `,
    '[class.open]': 'sidebarState.isOpen()'
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
      icon: 'chat',
      label: 'Chat',
      route: 'chat'
    },
    {
      icon: "hub",
      label: "Admin",
      subItems: [
        {
          icon: 'admin_panel_settings',
          label: 'User Authorization',
          route: 'admin/authorization'
        },
        {
          icon: 'history_toggle_off',
          label: 'User Login History',
          route: 'admin/login-history'
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





