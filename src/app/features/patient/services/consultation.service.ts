import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  GetVisitRecordDTO,
  GetMedicationDTO,
  PrescriptionsService,
  VisitRecordsService,
  SignaturesService,
  SignatureDTO,
  AddPrescriptionDTO,
  Int32ServiceResponse,
  AddInpatientDTO,
  InpatientsService
} from '@libs/api-client';

import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  // Convert signal to BehaviorSubject
  public readonly currentVisit = new BehaviorSubject<GetVisitRecordDTO | null>(null);

  public readonly prescriptions = signal<GetMedicationDTO[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string>('');

  private visitService = inject(VisitRecordsService);
  private prescriptionService = inject(PrescriptionsService);
  private signatureService = inject(SignaturesService);
  private inpatientService = inject(InpatientsService);
  private readonly destroyRef = inject(DestroyRef);

  public startConsultation(): void {
    const visit = this.currentVisit.value;
    if (!visit || !visit.visitId) return;

    const newVisit: GetVisitRecordDTO = {
      visitId: visit.visitId,
      diagnosis: "",
      treatment: "",
      notes: "Processing"
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.visitService.apiVisitRecordsPut(newVisit).pipe(
      takeUntilDestroyed(this.destroyRef),
      map(response => response.data || null),
      catchError(error => {
        console.error('Error starting consultation', error);
        this.isLoading.set(false);
        return of(null);
      })
    ).subscribe({
      next: (data: GetVisitRecordDTO | null) => {
        if (data) {
          this.currentVisit.next(data);
        }
      },
      error: (error) => {
        console.error('Error starting consultation', error);
        this.errorMessage.set(error.error?.message || 'Failed to start consultation');
      },
      complete: () => this.isLoading.set(false)
    });
  }

  public saveVisitRecord(needAdmission: boolean): void {
    const visit = this.currentVisit.value;
    if (!visit || !visit.visitId) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    // First save the visit record
    const visitSave$ = this.visitService.apiVisitRecordsPut(visit);

    // Then prepare prescriptions if any exist
    const prescriptions = this.prescriptions();
    let prescriptionSave$ = of(0) as Observable<Int32ServiceResponse>;

    if (prescriptions.length > 0) {
      const prescriptionRequests: Array<AddPrescriptionDTO> = prescriptions.map(medication => ({
        visitRecordId: visit.visitId,
        medicationId: medication.medicationId,
        dosage: medication.dosage || '',
        instructions: medication.dosage || ''
      }));

      prescriptionSave$ = this.prescriptionService.apiPrescriptionsBatchAddPost(prescriptionRequests);
    }

    // Prepare inpatient admission if needed
    let inpatientSave$ = of(null) as Observable<any>;
    if (needAdmission) {
      const addInpatient: AddInpatientDTO = {
        patientId: visit.patientId,
        practitionerId: visit.practitionerId,
        nurseId: 0,
        admissionDate: new Date(),
        reasonForAdmission: visit.diagnosis
      };
      inpatientSave$ = this.inpatientService.apiInpatientsPost(addInpatient);
    }

    // Execute all operations and handle results together
    forkJoin([visitSave$, prescriptionSave$, inpatientSave$])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          console.error('Error saving consultation data', error);
          this.errorMessage.set(error.error?.message || 'Failed to save consultation data');

          return of([null, null, null]);
        })
      )
      .subscribe({
        next: ([_, prescriptionResult, inpatientResult]) => {
          this.currentVisit.next(null);
          this.prescriptions.set([]);
          const prescCount = prescriptionResult?.data || 0;
          console.log(`Saved ${prescCount} prescriptions`);
          if (inpatientResult) {
            console.log('Patient admitted successfully');
          }
        },
        error: (error) => {
          console.error('Error saving consultation data', error);
          this.errorMessage.set(error.error?.message || 'Failed to save consultation data');
        },
        complete: () => {
          this.isLoading.set(false);
          this.errorMessage.set('');
        }
      });
  }

  // Prescription methods
  public addPrescription(medication: GetMedicationDTO): void {
    this.prescriptions.update(prescriptions => [...prescriptions, medication]);
  }

  public removePrescription(index: number): void {
    this.prescriptions.update(prescriptions => {
      const updated = [...prescriptions];
      updated.splice(index, 1);
      return updated;
    });
  }

  public clearPrescriptions(): void {
    this.prescriptions.set([]);
  }



  // Signature methods
  public setSignaturePath(path: string): void {
    const currentVisit = this.currentVisit.value;
    if (currentVisit) {
      this.currentVisit.next({ ...currentVisit, practitionerSignaturePath: path });
    }
  }

  public saveSignature(imageData: string): Observable<string> {
    const visit = this.currentVisit.value;
    if (!visit || !visit.visitId) return of('');

    const signatureDTO: SignatureDTO = {
      image: imageData,
      visitRecordId: visit.visitId
    };

    return this.signatureService.apiSignaturesPost(signatureDTO).pipe(
      map(response => response.data || ''),
      tap(path => {
        if (path && visit) {
          this.currentVisit.next({ ...visit, practitionerSignaturePath: path });
        }
      }),
      catchError(error => {
        console.error('Error saving signature', error);
        return of('');
      })
    );
  }


}




