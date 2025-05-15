import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { HeaderComponent } from "../header/header.component";
import { SidebarComponent } from "../sidebar/sidebar.component";
import { SidebarStateService } from '@core/services/sidebar-state.service';
import { MasterDataService } from '@core/services/master-data.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit {
  protected readonly sidebarState = inject(SidebarStateService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly masterDataService = inject(MasterDataService);

  ngOnInit(): void {
    // Initialize master data
    this.masterDataService.initializeData();

    // Monitor screen size changes
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        // If screen is small (XSmall or Small breakpoint matches)
        if (result.matches) {
          this.sidebarState.close();
        }
      });
  }

  closeSidebarForSmallScreens(): void {
    // Use breakpoint observer for one-time checks too
    if (this.breakpointObserver.isMatched([Breakpoints.XSmall, Breakpoints.Small])) {
      this.sidebarState.close();
    }
  }
}
