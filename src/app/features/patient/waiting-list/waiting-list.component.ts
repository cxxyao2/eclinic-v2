import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import {
  GetVisitRecordDTO,
  VisitRecordsService
} from '@libs/api-client';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-waiting-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule
  ],
  templateUrl: './waiting-list.component.html',
  styleUrl: './waiting-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingListComponent implements OnInit, OnDestroy {
  // Protected signals and state
  protected readonly patients = signal<GetVisitRecordDTO[]>([]);
  protected readonly todayInISOFormat = new Date(formatDateToYyyyMmDdPlus((new Date()), '00:00:00')).toISOString();
  protected currentIndex = 0;

  // Private properties
  private readonly visitService = inject(VisitRecordsService);
  private intervalId?: number;
  private readonly destroyRef = inject(DestroyRef);

  // Replace manual subscription with observable + async pipe
  protected readonly waitingList$ = computed(() => {

    return this.visitService.apiVisitRecordsWaitingListGet(this.todayInISOFormat).pipe(
      map(res => res.data ?? []),
      catchError(() => of([]))
    );
  });


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
