import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';

import {
  AddInpatientDTO, GetMedicationDTO, GetPractitionerDTO, GetVisitRecordDTO,
  InpatientsService, PractitionersService, PrescriptionsService, UsersService, VisitRecordsService
} from '@libs/api-client';
import { CanvasComponent } from '@shared/components/canvas/canvas.component';
import { ConsulationFormMedicComponent } from '../consulation-form-medic/consulation-form-medic.component';
import { MasterDataService } from '@core/services/master-data.service';
import { SnackbarService } from '@core/services/snackbar-service.service';
import { DialogSimpleDialog } from '@shared/components/dialog/dialog-simple-dialog';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';


@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    ConsulationFormMedicComponent,
  ],
  templateUrl: './consultation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationFormComponent implements OnInit {
  // ViewChild decorators
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
  @ViewChild(MatSort) private readonly sort!: MatSort;
  @ViewChild('prescriptionTable') private readonly prescriptionTable!: ConsulationFormMedicComponent;
  @ViewChild('signature') private readonly practitionerSign!: CanvasComponent;

  // Form controls
  protected readonly visitControl = new FormControl<GetVisitRecordDTO>({});
  protected readonly needsAdmissionControl = new FormControl(false);
  protected readonly diagnosisControl = new FormControl('');
  protected readonly treatmentControl = new FormControl('');
  protected readonly diagnosisForm = inject(FormBuilder).group({
    visitRecord: this.visitControl,
    admission: this.needsAdmissionControl,
    diagnosis: this.diagnosisControl,
    treatment: this.treatmentControl
  });

  // Signals and Observables
  protected readonly visitRecord = toSignal(this.visitControl.valueChanges);
  protected readonly needAdmission = toSignal(this.needsAdmissionControl.valueChanges);
  protected readonly scheduledVisits = signal<GetVisitRecordDTO[]>([]);
  protected readonly practitioner = signal<GetPractitionerDTO>({});
  protected readonly isProcessing = signal<boolean>(false);
  protected readonly imageFile = signal<string>('');
  protected readonly isImageViewerOpen = signal<boolean>(false);

  // Table related properties
  protected readonly dataSource = new MatTableDataSource<GetMedicationDTO>([]);
  protected readonly displayedColumns: readonly string[] = ['no', 'medicationId', 'medicationName', 'dosage', 'action'];

  // Private properties
  private readonly visitDate = new Date();
  private readonly signatureFilePath = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  // Service injections
  private readonly masterService = inject(MasterDataService);
  private readonly visitService = inject(VisitRecordsService);
  private readonly userService = inject(UsersService);
  private readonly practitionerService = inject(PractitionersService);
  private readonly inpatientService = inject(InpatientsService);
  private readonly prescriptionService = inject(PrescriptionsService);
  private readonly snackbarService = inject(SnackbarService);
  protected readonly dialog = inject(MatDialog);

  public ngOnInit(): void {
    this.initializePractitioner();
    this.fetchVistRecord();
  }

  protected onStart(): void {
    if (((this.visitRecord()?.visitId) ?? 0) === 0) return;

    const newVisit: GetVisitRecordDTO = {
      visitId: this.visitRecord()?.visitId,
      diagnosis: "",
      treatment: "",
      notes: "Processing"
    };

    this.visitService.apiVisitRecordsPut(newVisit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => console.log('res.data', res.data),
        error: (err) => console.error('error', err)
      });

    this.isProcessing.set(true);
  }

  protected onEnd(): void {
    const diagnosis = this.diagnosisForm.value.diagnosis ?? "";
    const treatment = this.diagnosisForm.value.treatment ?? "";
    const reason = "Patient does not show up";

    if (this.shouldShowConfirmDialog(diagnosis, treatment)) {
      this.showConfirmDialog(reason);
      return;
    }

    if (this.shouldShowSignatureDialog(diagnosis, treatment)) {
      this.showSignatureDialog();
      return;
    }

    this.saveVisitRecord(diagnosis, treatment, reason);
  }

  protected removeMedication(rowNo: number): void {
    const data = [...this.dataSource.data];
    data.splice(rowNo, 1);
    this.dataSource.data = data;
  }

  protected refreshForm(): void {
    this.fetchVistRecord();
    this.diagnosisForm.reset();
    this.practitionerSign.clearCanvas();
  }

  private initializePractitioner(): void {
    const userEmail = this.masterService.userSubject.value?.email;
    if (!userEmail) return;

    this.userService.apiUsersGet(userEmail)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((res) => {
          if (res?.length > 0) {
            return this.practitionerService.apiPractitionersIdGet(res[0].practitionerId ?? 0);
          }
          throw new Error('No user found');
        })
      ).subscribe({
        next: (res) => {
          if (res?.data) {
            this.practitioner.set(res.data);
          }
        },
        error: (error) => console.error('An error occurred:', error.message)
      });
  }

  private fetchVistRecord(): void {
    const formatedDate = formatDateToYyyyMmDdPlus(this.visitDate);
    this.visitService.apiVisitRecordsGet(this.practitioner().practitionerId,formatedDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const data = (res.data ?? []).filter(ele => ele.diagnosis === "");
          this.scheduledVisits.set(data);
        },
        error: (err) => console.error('Error is ', err)
      });
  }

  private shouldShowConfirmDialog(diagnosis: string, treatment: string): boolean {
    return !(diagnosis || treatment);
  }

  private shouldShowSignatureDialog(diagnosis: string, treatment: string): boolean {
    return !!(diagnosis || treatment) && this.signatureFilePath() === "";
  }

  private showConfirmDialog(reason: string): void {
    const dialogRef = this.dialog.open(DialogSimpleDialog, {
      data: {
        title: 'Confirm Action',
        content: `Do you end calling because ${reason}?`,
        isCancelButtonVisible: true
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;
      });
  }

  private showSignatureDialog(): void {
    this.dialog.open(DialogSimpleDialog, {
      data: {
        title: 'Notification',
        content: 'Please sign your name on the touchpad before saving the prescription.',
        isCancelButtonVisible: false
      },
    });
  }

  private saveVisitRecord(diagnosis: string, treatment: string, reason: string): void {
    const newVisit: GetVisitRecordDTO = {
      visitId: this.visitRecord()?.visitId ?? 0,
      diagnosis,
      treatment,
      practitionerSignaturePath: this.signatureFilePath(),
      notes: `Process ended. ${reason}`
    };

    this.visitService.apiVisitRecordsPut(newVisit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          console.log('res.data', res.data);
          this.snackbarService.show("Diagnosis saved successfully.");
          this.refreshForm();
        },
        error: (err) => console.error('error', err),
        complete: () => this.isProcessing.set(false)
      });

    if (this.diagnosisForm.value.admission) {
      this.createInpatientRecord();
    }
  }

  private createInpatientRecord(): void {
    const addInpatient: AddInpatientDTO = {
      // Add inpatient properties here
    };
    // Implement inpatient record creation logic
  }
}
