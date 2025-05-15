import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BedsService, GetBedDTO } from '@libs/api-client';
import { MasterDataService } from '@core/services/master-data.service';
import { BEDNUMBER_PER_ROOM } from '@shared/constants/rooms-with-beds.constants';

interface Room {
  readonly roomNo: string;
  readonly totalBeds: number;
  readonly occupiedBeds: number;
  readonly emptyBeds: number;
}

@Component({
  selector: 'app-inpatient-rooms',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './inpatient-rooms.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InpatientRoomsComponent implements OnInit {
  // Private injected services
  private readonly bedService = inject(BedsService);
  private readonly masterService = inject(MasterDataService);
  private readonly destroyRef = inject(DestroyRef);

  // Protected signals
  protected groupedRooms = signal<Room[]>([]);
  protected readonly selectedPatient = toSignal(this.masterService.selectedPatientSubject$);



  // Lifecycle hooks
  public ngOnInit(): void {
    this.loadBeds();
  }

  // Private methods
  private loadBeds(): void {
    this.bedService.apiBedsGet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = res.data ?? [];
          this.masterService.bedsSubject$.next(data);
          this.processRoomData(data);
        },
        error: (err) => console.error('Failed to load beds:', err)
      });
  }

  private processRoomData(beds: GetBedDTO[]): void {
    const roomMap = beds.reduce((acc, bed) => {
      const roomNo = bed.roomNumber ?? '';

      if (!acc[roomNo]) {
        // Create a mutable room object
        const room = {
          roomNo,
          totalBeds: BEDNUMBER_PER_ROOM,
          occupiedBeds: BEDNUMBER_PER_ROOM,
          emptyBeds: 0
        };
        acc[roomNo] = room;
      }

      // Mutate the accumulated room object
      if (!bed.inpatientId) {
        acc[roomNo] = {
          ...acc[roomNo],
          emptyBeds: acc[roomNo].emptyBeds + 1,
          occupiedBeds: acc[roomNo].occupiedBeds - 1
        };
      }

      return acc;
    }, {} as Record<string, Room>);

    // Convert to readonly Room[] when setting the signal
    this.groupedRooms.set(Object.values(roomMap) as Room[]);
  }
}
