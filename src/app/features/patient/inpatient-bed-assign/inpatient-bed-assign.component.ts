import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BedsService, GetBedDTO, GetInpatientDTO, InpatientsService, UpdateBedDTO } from '@libs/api-client';
import { MasterDataService } from '@services/master-data.service';
import { combineLatest, concatMap, finalize, from, map } from 'rxjs';

@Component({
  selector: 'app-inpatient-bed-assign',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './inpatient-bed-assign.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InpatientBedAssignComponent implements OnInit {

  // Private properties
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bedService = inject(BedsService);
  private readonly masterService = inject(MasterDataService);
  private readonly inpatientService = inject(InpatientsService);
  private readonly destroyRef = inject(DestroyRef);
  private existingInpatients: readonly GetInpatientDTO[] = [];

  // Protected properties for template access
  protected readonly patientInWaiting = toSignal(this.masterService.selectedPatientSubject);
  protected roomNumber: string | null = null;
  protected bedsOfRoom: readonly GetBedDTO[] = [];


  public ngOnInit(): void {
    this.initializeRoomData();
    this.fetchInpatients();
  }

  protected addToRoom(): void {
    const currentBeds = [...this.bedsOfRoom];
    const emptyBed = currentBeds.find(bed => !bed.inpatientId);

    if (!emptyBed || !this.patientInWaiting()) return;

    const updatedBed = {
      ...emptyBed,
      inpatientId: this.patientInWaiting()?.inpatientId,
      patientName: this.patientInWaiting()?.patientName,
      practitionerName: this.patientInWaiting()?.practitionerName
    };

    this.bedsOfRoom = currentBeds.map(bed =>
      bed.bedNumber === emptyBed.bedNumber ? updatedBed : bed
    );
  }

  protected removeFromRoom(): void {
    const currentBeds = [...this.bedsOfRoom];
    const occupiedBed = currentBeds.find(
      bed => bed.inpatientId === this.patientInWaiting()?.inpatientId
    );

    if (!occupiedBed) return;

    const updatedBed = {
      ...occupiedBed,
      inpatientId: null,
      patientName: null,
      practitionerName: null
    };

    this.bedsOfRoom = currentBeds.map(bed =>
      bed.bedNumber === occupiedBed.bedNumber ? updatedBed : bed
    );
  }

  protected drop(event: CdkDragDrop<GetBedDTO[]>): void {
    const { previousIndex, currentIndex } = event;
    const beds = [...this.bedsOfRoom];

    const updatedBeds = beds.map((bed, index) => {
      if (index === previousIndex) {
        return { ...bed, ...this.getPatientInfo(beds[currentIndex]) };
      }
      if (index === currentIndex) {
        return { ...bed, ...this.getPatientInfo(beds[previousIndex]) };
      }
      return bed;
    });

    this.bedsOfRoom = updatedBeds;
  }

  protected async onSave(): Promise<void> {
    try {
      await this.saveBeds();
      await this.saveInpatients();
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Operation failed:', error);
    }
  }

  private initializeRoomData(): void {
    combineLatest([
      this.route.paramMap,
      this.masterService.bedsSubject
    ]).pipe(
      map(([params, beds]) => ({
        roomNumber: params.get('roomNumber'),
        filteredBeds: beds.filter(b => b.roomNumber === params.get('roomNumber'))
      })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ roomNumber, filteredBeds }) => {
      this.roomNumber = roomNumber;
      this.bedsOfRoom = [...filteredBeds];
    });
  }

  private fetchInpatients(): void {
    if (!this.roomNumber) return;

    this.inpatientService.apiInpatientsGet(this.roomNumber)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.existingInpatients = res.data ?? [],
        error: (err) => console.error('Failed to fetch inpatients:', err)
      });
  }

  private getPatientInfo(bed: GetBedDTO) {
    return {
      patientName: bed.patientName,
      inpatientId: bed.inpatientId,
      practitionerName: bed.practitionerName
    };
  }

  private async saveBeds(): Promise<void> {
    const saveBeds$ = from(this.bedsOfRoom).pipe(
      concatMap((bed: GetBedDTO) => this.bedService.apiBedsPut(bed as UpdateBedDTO))
    );

    return new Promise((resolve, reject) => {
      saveBeds$.subscribe({
        complete: resolve,
        error: reject
      });
    });
  }

  private async saveInpatients(): Promise<void> {
    const nurseId = this.masterService.userSubject.value?.practitionerId;
    const changedInPatients = this.bedsOfRoom
      .filter(bed => bed.inpatientId)
      .map(bed => ({
        inpatientId: bed.inpatientId!,
        nurseId,
        roomNumber: bed.roomNumber,
        bedNumber: bed.bedNumber
      }));

    const saveInpatients$ = from(changedInPatients).pipe(
      concatMap((inp: GetInpatientDTO) => this.inpatientService.apiInpatientsPut(inp))
    );

    return new Promise((resolve, reject) => {
      saveInpatients$.subscribe({
        complete: resolve,
        error: reject
      });
    });
  }
}
