import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BedsService, GetBedDTO, InpatientsService, UpdateBedDTO } from '@libs/api-client';
import { MasterDataService } from '@services/master-data.service';
import { combineLatest, finalize, map, forkJoin } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-inpatient-bed-assign',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
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


  // Protected properties for template access
  protected readonly patientInWaiting = toSignal(this.masterService.selectedPatientSubject);
  protected roomNumber: string | null = null;
  protected bedsOfRoom: readonly GetBedDTO[] = [];
  protected readonly isLoadingResults = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly isAssigned = signal<boolean>(false);


  public ngOnInit(): void {
    this.initializeRoomData();
  }

  protected addToRoom(): void {
    const currentBeds = [...this.bedsOfRoom];
    const emptyBed = currentBeds.find(bed => !bed.inpatientId);

    if (!emptyBed || !this.patientInWaiting()) return;

    const updatedBed = {
      ...emptyBed,
      inpatientId: this.patientInWaiting()?.inpatientId,
      patientName: this.patientInWaiting()?.patientName,
      practitionerName: this.patientInWaiting()?.practitionerName,
      nurseId: this.masterService.userSubject.value?.userID,
      nurseName: this.masterService.userSubject.value?.userName
    };

    this.bedsOfRoom = currentBeds.map(bed =>
      bed.bedNumber === emptyBed.bedNumber ? updatedBed : bed
    );
    this.isAssigned.set(true);
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

    this.isAssigned.set(false);
  }

  // change room by drag & drop
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

  protected onSave(): void {
    this.isLoadingResults.set(true);
    this.errorMessage.set('');

    forkJoin([
      this.saveBeds(),
      this.saveInpatients()
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.isLoadingResults.set(false))
    ).subscribe({
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(JSON.stringify(error.error.errors) || 'Failed to save changes');
      },
      complete: () => {
        this.masterService.selectedPatientSubject.next(null);
        this.router.navigate(['/dashboard']);
      },
    });
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



  private getPatientInfo(bed: GetBedDTO) {
    return {
      patientName: bed.patientName,
      inpatientId: bed.inpatientId,
      practitionerName: bed.practitionerName
    };
  }

  private saveBeds() {
    const updatedBeds: UpdateBedDTO[] = this.bedsOfRoom.map(bed => ({
      bedId: bed.bedId,
      inpatientId: bed.inpatientId
    }));

    return this.bedService.apiBedsBatchUpdatePut(updatedBeds);

  }

  private saveInpatients() {
    const nurseId = this.masterService.userSubject.value?.userID;
    const changedInPatients = this.bedsOfRoom
      .filter(bed => bed.inpatientId)
      .map(bed => ({
        inpatientId: bed.inpatientId!,
        nurseId,
        roomNumber: bed.roomNumber,
        bedNumber: bed.bedNumber
      }));

    return this.inpatientService.apiInpatientsBatchUpdatePut(changedInPatients);

  }
}
