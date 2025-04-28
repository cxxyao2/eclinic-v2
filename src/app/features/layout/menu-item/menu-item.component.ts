import { ChangeDetectionStrategy, Component, DestroyRef, HostBinding, inject, input, OnInit, signal } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { RouterModule, Router, IsActiveMatchOptions } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NavService } from '@services/nav.service';
import { SidebarStateService } from '@core/services/sidebar-state.service';
import { MenuItem } from '../menu-item';

@Component({
    selector: 'app-menu-item',
    standalone: true,
    imports: [
        NgClass,
        NgStyle,
        RouterModule,
        MatIconModule,
        MatListModule,
        MatTooltipModule,
        TranslocoDirective
    ],
    templateUrl: './menu-item.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuItemComponent implements OnInit {
    // Public inputs and signals
    public readonly item = input.required<MenuItem>();
    public readonly showLabel = input<boolean>(true);
    public readonly depth = input<number>(0);

    // Protected signals
    protected readonly expanded = signal(false);

    // Host bindings
    @HostBinding('attr.aria-expanded')
    protected readonly ariaExpanded = this.expanded;

    // Private dependencies
    private readonly destroyRef = inject(DestroyRef);
    private readonly navService = inject(NavService);
    private readonly router = inject(Router);;
    private readonly sidebarState = inject(SidebarStateService);

    // Add match options as a class property
    private readonly matchOptions: IsActiveMatchOptions = {
        paths: 'exact',
        queryParams: 'exact',
        fragment: 'ignored',
        matrixParams: 'ignored'
    };

    public ngOnInit(): void {
        this.initializeUrlSubscription();
    }

    protected onItemSelected(item: MenuItem): void {
        if (this.hasSubItems(item)) {
            this.toggleExpanded();
            return;
        }

        this.navigateToRoute(item.route);
    }

    protected isActive(route?: string): boolean {
        return route ? this.router.isActive(route, this.matchOptions) : false;
    }

    protected hasSubItems(item: MenuItem): boolean {
        return (item.subItems?.length ?? 0) > 0;
    }

    private initializeUrlSubscription(): void {
        this.navService.currentUrl
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(url => {
                if (this.item().route && url) {
                    this.expanded.set(url.startsWith(`/${this.item().route}`));
                }
            });
    }

    private toggleExpanded(): void {
        this.expanded.update(value => !value);
    }

    private navigateToRoute(route?: string): void {
        if (!route) return;
        this.sidebarState.close();
        this.router.navigate([route]);
    }

}
