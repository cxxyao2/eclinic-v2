import { Injectable, DestroyRef, inject } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GetVisitRecordDTO, VisitRecordsService } from '@libs/api-client';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class WaitingListService {
  private readonly visitService = inject(VisitRecordsService);
  private readonly destroyRef = inject(DestroyRef);

  // BehaviorSubject to store the latest data
  private readonly waitingListSubject$ = new BehaviorSubject<GetVisitRecordDTO[]>([]);

  // Observable that refreshes every 3 minutes
  private readonly refreshInterval = 3 * 60 * 1000; // 3 minutes in milliseconds

  constructor() {
    this.setupAutoRefresh();
  }

  // Public method to get the waiting list as an observable
  public getWaitingList(): Observable<GetVisitRecordDTO[]> {
    return this.waitingListSubject$.asObservable();
  }

  // Public method to force a refresh
  public refreshWaitingList(): void {
    this.fetchWaitingList();
  }

  // Private method to set up automatic refresh
  private setupAutoRefresh(): void {
    // Initial fetch
    this.fetchWaitingList();

    // Set up timer for periodic refresh
    timer(this.refreshInterval, this.refreshInterval)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.fetchWaitingList());
  }

  // Private method to fetch data from API
  private fetchWaitingList(): void {
    const todayInISOFormat = new Date(
      formatDateToYyyyMmDdPlus(new Date(), '00:00:00')
    ).toISOString();

    this.visitService.apiVisitRecordsWaitingListGet(todayInISOFormat)
      .pipe(
        map(res => res.data ?? []),
        catchError(() => {
          console.error('Failed to fetch waiting list');
          return [];
        })
      )
      .subscribe(data => this.waitingListSubject$.next(data));
  }
}