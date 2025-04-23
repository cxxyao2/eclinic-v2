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
  InpatientsService,
  GetInpatientDTOServiceResponse,
  GetVisitRecordDTOServiceResponse
} from '@libs/api-client';

import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  public readonly currentVisit = new BehaviorSubject<GetVisitRecordDTO | null>(null);
  public readonly prescriptions = signal<GetMedicationDTO[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string>('');


  private visitService = inject(VisitRecordsService);
  private prescriptionService = inject(PrescriptionsService);
  private inpatientService = inject(InpatientsService);
  private readonly destroyRef = inject(DestroyRef);


  public startConsultation(): Observable<GetVisitRecordDTO | null> {
    const visit = this.currentVisit.value;
    if (!visit) {
      return of(null);
    }

    const newVisit: GetVisitRecordDTO = {
      visitId: visit.visitId,
      diagnosis: "",
      treatment: "",
      notes: "Processing"
    };
    return this.visitService.apiVisitRecordsPut(newVisit).pipe(
      map(response => response.data || null),
      catchError(error => {
        console.error('Error starting consultation', error);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  public saveVisitRecord(needAdmission: boolean): Observable<[GetVisitRecordDTOServiceResponse, Int32ServiceResponse, GetInpatientDTOServiceResponse]> {
    const visit = this.currentVisit.value;

    // First save the visit record
    if (!visit) throw new Error('No active visit found. Please select a visit record first.');
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
    let inpatientSave$ = of({}) as Observable<GetInpatientDTOServiceResponse>
    if (needAdmission && (visit.diagnosis??'').length > 0) {
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
    return forkJoin([visitSave$, prescriptionSave$, inpatientSave$]);
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
    this.currentVisit.next({});
  }



  // Signature methods
  public setSignaturePath(path: string): void {
    const currentVisit = this.currentVisit.value;
    if (currentVisit) {
      this.currentVisit.next({ ...currentVisit, practitionerSignaturePath: path });
    }
  }


}





