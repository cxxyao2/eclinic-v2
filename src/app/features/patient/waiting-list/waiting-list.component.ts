import { CommonModule } from '@angular/common';
import { 
  AfterViewInit, 
  ChangeDetectionStrategy, 
  Component, 
  inject, 
  OnDestroy, 
  OnInit, 
  signal 
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { 
  GetVisitRecordDTO, 
  GetVisitRecordDTOListServiceResponse, 
  VisitRecordsService 
} from '@libs/api-client';

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
export class WaitingListComponent implements AfterViewInit, OnInit, OnDestroy {
  // Protected signals and state
  protected readonly patients = signal<GetVisitRecordDTO[]>([]);
  protected readonly today = new Date();
  protected currentIndex = 0;

  // Private properties
  private readonly visitService = inject(VisitRecordsService);
  private intervalId?: number;

  public ngAfterViewInit(): void {
    this.getWaitingListByDate(this.today);
  }

  public ngOnInit(): void {
    this.startCarousel();
  }

  public ngOnDestroy(): void {
    this.stopCarousel();
  }

  protected onTabChange(index: number): void {
    this.currentIndex = index;
  }

  private getWaitingListByDate(bookedDate: Date): void {
    this.visitService.apiVisitRecordsWaitingListGet(bookedDate).subscribe({
      next: (res: GetVisitRecordDTOListServiceResponse) => {
        const visits = res.data ?? [];
        this.patients.set(visits);
      },
      error: () => { 
        // Handle error if needed
      }
    });
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
