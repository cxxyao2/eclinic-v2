import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import {
  GetVisitRecordDTO,
  VisitRecordsService
} from '@libs/api-client';
import { MasterDataService } from '@core/services/master-data.service';
import { SnackbarService } from '@core/services/snackbar-service.service';
import { DialogSimpleDialog } from '@shared/components/dialog/dialog-simple-dialog';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';
import { ConsultationService } from '../services/consultation.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConsulationFormMedicComponent } from "../consulation-form-medic/consulation-form-medic.component";
import { ConsulationSignatureComponent } from "../consulation-signature/consulation-signature.component";

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
    MatProgressSpinnerModule,
    ConsulationFormMedicComponent,
    ConsulationSignatureComponent
  ],
  templateUrl: './consultation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationFormComponent implements OnInit {
  protected readonly visitControl = new FormControl<GetVisitRecordDTO | null>(null);
  protected readonly needsAdmissionControl = new FormControl(false);
  protected readonly diagnosisControl = new FormControl('');
  protected readonly treatmentControl = new FormControl('');
  protected readonly diagnosisForm = inject(FormBuilder).group({
    visitRecord: this.visitControl,
    admission: this.needsAdmissionControl,
    diagnosis: this.diagnosisControl,
    treatment: this.treatmentControl
  });

  // Service injections
  private readonly consultationService = inject(ConsultationService);
  private readonly masterService = inject(MasterDataService);
  private visitService = inject(VisitRecordsService);
  private readonly snackbar = inject(SnackbarService);
  protected readonly dialog = inject(MatDialog);


  // Signals and Observables
  protected readonly visitRecord = toSignal(this.visitControl.valueChanges);
  protected readonly needAdmission = toSignal(this.needsAdmissionControl.valueChanges);
  protected readonly scheduledVisits = rxResource<GetVisitRecordDTO[], void>({
    loader: () => {
      const practitionerId = this.practitioner.value?.userID ?? 0;
      const formattedDate = new Date(formatDateToYyyyMmDdPlus(this.visitDate, '00:00:00')).toISOString();

      return this.visitService.apiVisitRecordsGet(practitionerId, formattedDate)
        .pipe(
          map(res => (res.data ?? []).filter(ele => (ele.notes ?? '') === ''))
        );
    }
  });
  protected readonly practitioner = this.masterService.userSubject;
  protected readonly currentVisit$ = this.consultationService.currentVisit;
  readonly isLoading = this.consultationService.isLoading;
  readonly errorMessage = this.consultationService.errorMessage;


  // Private properties
  private readonly visitDate = new Date();
  private readonly destroyRef = inject(DestroyRef);


  public ngOnInit(): void {
    this.consultationService.clearPrescriptions();
    this.consultationService.currentVisit.next({});

    // Subscribe to visitControl value changes
    this.visitControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visitValue => {
        this.consultationService.currentVisit.next(visitValue);

      });
  }

  protected onStart(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.consultationService.startConsultation()
      .subscribe({
        next: (data: GetVisitRecordDTO | null) => {
          if (data) {
            this.currentVisit$.next(data);
          }
        },
        error: (error) => {
          console.error('Error starting consultation', error);
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to start consultation');
        },
        complete: () => this.isLoading.set(false)
      });
  }

  protected onEnd(): void {
    const diagnosis = this.diagnosisForm.value.diagnosis ?? "";
    const treatment = this.diagnosisForm.value.treatment ?? "";
    const isAdmission = this.diagnosisForm.value.admission ?? false;

    if (!this.currentVisit$.value?.practitionerSignaturePath) {
      this.showSignatureDialog();
      return;
    }

    const reason = "Patient does not show up";
    if ((diagnosis + treatment).length >= 1) {
      this.saveConsultation(diagnosis, treatment, reason, isAdmission);
      return;
    }


    const dialogRef = this.dialog.open(DialogSimpleDialog, {
      data: { title: 'Confirm Action', content: `Do you end calling because ${reason}?`, isCancelButtonVisible: true }
    });

    dialogRef.afterClosed()
      .pipe(
        map(result => result === 'Confirm'),
        takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (confirm) => {
          if (confirm) {
            this.saveConsultation(diagnosis, treatment, reason, isAdmission);
          }
        }
      })

  }

  private saveConsultation(diagnosis: string, treatment: string, reason: string, isAdmission = false): void {
    this.currentVisit$.next({
      ...this.currentVisit$.value,
      diagnosis,
      treatment,
      notes: `Process ended. ${reason}`
    });

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.consultationService.saveVisitRecord(isAdmission)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([visitResult, prescriptionResult, inpatientResult]) => {
          this.refreshFormAndRelated();
          
          visitResult.message && this.snackbar.show(visitResult.message);
          prescriptionResult.message && this.snackbar.show(prescriptionResult.message);
          inpatientResult.message && this.snackbar.show(inpatientResult.message);
        },
        error: (error) => {
          console.error('Error saving consultation data', error);
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to save consultation data');
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });;
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


  // Refresh method to manually trigger a refresh of the scheduledVisits
  protected refreshFormAndRelated(): void {
    this.scheduledVisits.reload();
    this.diagnosisForm.reset();
    this.consultationService.clearPrescriptions();
  }

}
