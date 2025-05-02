import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { GetVisitRecordDTO } from '@libs/api-client';
import { WaitingListService } from '../services/waiting-list.service';

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule
  ],
  templateUrl: './waiting-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingListComponent implements OnInit, OnDestroy {
  // Services
  private readonly waitingListService = inject(WaitingListService);
  private readonly destroyRef = inject(DestroyRef);
  
  // State
  protected currentIndex = 0;
  private intervalId?: number;
  
  // Convert the observable to a signal
  protected readonly waitingList = toSignal(
    this.waitingListService.getWaitingList(),
    { initialValue: [] }
  );

  public ngOnInit(): void {
    this.startCarousel();
  }

  public ngOnDestroy(): void {
    this.stopCarousel();
  }

  protected onTabChange(index: number): void {
    this.currentIndex = index;
  }

  private startCarousel(): void {
    this.intervalId = window.setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % 3;
    }, 2000);
  }

  private stopCarousel(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }
}
