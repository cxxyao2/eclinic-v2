import { DestroyRef, PLATFORM_ID, inject, Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GetBedDTO, GetImageRecordDTO, GetInpatientDTO, GetMedicationDTO, GetPatientDTO, GetPractitionerDTO, ImageRecordsService, User, UsersService } from '@libs/api-client';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PractitionersService, PatientsService, MedicationsService } from '@libs/api-client';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class MasterDataService {
  // Public properties
  public readonly messageSubject = new BehaviorSubject<string>('');
  public readonly practitionersSubject = new BehaviorSubject<GetPractitionerDTO[]>([]);
  public readonly medicationsSubject = new BehaviorSubject<GetMedicationDTO[]>([]);
  public readonly patientsSubject = new BehaviorSubject<GetPatientDTO[]>([]);
  public readonly bedsSubject = new BehaviorSubject<GetBedDTO[]>([]);
  public readonly userSubject = new BehaviorSubject<User | null>(null);
  public readonly imageRecordsSubjet = new BehaviorSubject<GetImageRecordDTO[]>([]);
  public readonly selectedPatientSubject = new BehaviorSubject<GetInpatientDTO | null>(null);

  // Private properties
  private readonly practitionerService = inject(PractitionersService);
  private readonly patientService = inject(PatientsService);
  private readonly medicationService = inject(MedicationsService);
  private readonly imageService = inject(ImageRecordsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usersService = inject(UsersService);

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    this.fetchPatients();
    this.fetchPractitioners();
    this.fetchMedications();
    this.fetchImageRecords();
  }


  public validateTokenAndFetchUser(): Observable<User | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return of(null);
    }

    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      this.userSubject.next(null);
      return of(null);
    }

    return new Observable<User | null>(observer => {
      try {
        const decodedToken: any = jwtDecode(token);
        const isExpired = decodedToken.exp * 1000 < Date.now();

        if (isExpired) {
          localStorage.removeItem('accessToken');
          this.userSubject.next(null);
          observer.next(null);
          observer.complete();
          return;
        }

        const userId = decodedToken['nameidentifier'] || 
                      decodedToken['nameid'] || 
                      decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
                      Object.entries(decodedToken).find(([key]) => key.toLowerCase().endsWith('nameidentifier'))?.[1];

        if (!userId) {
          localStorage.removeItem('accessToken');
          this.userSubject.next(null);
          observer.next(null);
          observer.complete();
          return;
        }

        this.usersService.apiUsersIdGet(Number(userId))
          .pipe(
            map((response: any) => response.data ?? null),
            takeUntilDestroyed(this.destroyRef)
          ).subscribe({
            next: (user) => {
              if (user) {
                this.userSubject.next(user);
                observer.next(user);
              } else {
                localStorage.removeItem('accessToken');
                this.userSubject.next(null);
                observer.next(null);
              }
              observer.complete();
            },
            error: () => {
              localStorage.removeItem('accessToken');
              this.userSubject.next(null);
              observer.next(null);
              observer.complete();
            }
          });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('accessToken');
        this.userSubject.next(null);
        observer.next(null);
        observer.complete();
      }
    });
  }



  fetchImageRecords(): void {
    this.imageService.apiImageRecordsGet()
      .pipe(
        map(response => response.data ?? []),
        catchError(error => {
          this.messageSubject.next(error?.message ?? JSON.stringify(error));
          return [];
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data) => {
          this.imageRecordsSubjet.next(data);
          this.messageSubject.next('');
        }
      });
  }


  fetchPractitioners(): void {
    this.practitionerService.apiPractitionersGet()
      .pipe(
        map(response => response.data ?? []),
        catchError(error => {
          this.messageSubject.next(error?.message ?? JSON.stringify(error));
          return [];
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data) => {
          this.practitionersSubject.next(data);
          this.messageSubject.next('');
        }
      });
  }



  // Fetch and store medications
  fetchMedications(): void {
    this.medicationService.apiMedicationsGet()
      .pipe(
        map(response => response.data ?? []),
        catchError(error => {
          this.messageSubject.next(error?.message ?? JSON.stringify(error));
          return [];
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data) => {
          this.medicationsSubject.next(data);
          this.messageSubject.next('');
        }
      });
  }


  fetchPatients(): void {
    this.patientService.apiPatientsGet()
      .pipe(
        map(response => response.data ?? []),
        catchError(error => {
          this.messageSubject.next(error?.message ?? JSON.stringify(error));
          return [];
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (data) => {
          this.patientsSubject.next(data);
          this.messageSubject.next('');
        }
      });
  }

}
