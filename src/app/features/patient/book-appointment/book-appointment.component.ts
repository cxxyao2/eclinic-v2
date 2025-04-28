// Angular Core Imports
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, concatMap, debounceTime, distinctUntilChanged, finalize, from, map, merge, of as observableOf, startWith, switchMap, tap } from 'rxjs';


// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { provideNativeDateAdapter } from '@angular/material/core';

// Application Imports
import { AddPractitionerScheduleDTO, GetPatientDTO, GetPractitionerScheduleDTO, PractitionerSchedulesService } from '@libs/api-client';
import { ProfileComponent } from '@shared/components/profile/profile.component';
import { UserProfile } from '@shared/models/userProfile.model';
import { MasterDataService } from '@core/services/master-data.service';
import { SnackbarService } from '@core/services/snackbar-service.service';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';



@Component({
    selector: 'app-book-appointment',
    standalone: true,
    providers: [provideNativeDateAdapter()],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatSortModule,
        MatTableModule,
        ProfileComponent
    ],
    templateUrl: './book-appointment.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookAppointmentComponent implements AfterViewInit {
    // Readonly Constants
    public readonly columnHeaders: Readonly<{ [key: string]: string }> = {
        index: '#',
        practitionerName: 'Practitioner',
        startDateTime: 'From Time',
        actions: 'Actions',
        endDateTime: 'End Time',
        patientName: 'Patient',

    };

    // Signals and State
    protected readonly imagePath = signal<string>('assets/avatars/patient2-350px.jpg');
    protected readonly patients = signal<GetPatientDTO[]>([]);
    protected readonly selectedPatient = signal<UserProfile>({} as UserProfile);
    protected isLoadingResults = signal(false);

    // Form Controls
    protected readonly workDayControl = new FormControl<Date | null>(new Date());
    protected readonly patientIdControl = new FormControl<number | null>(0);

    // Signals from Form Controls
    protected readonly workDay$ = toSignal(this.workDayControl.valueChanges, { initialValue: new Date() });
    protected readonly patientId$ = toSignal(this.patientIdControl.valueChanges, { initialValue: 0 });

    // Table Configuration
    protected readonly displayedColumns: readonly string[] = ['index', 'practitionerName', 'startDateTime', 'actions', 'endDateTime', 'patientName'];
    protected readonly dataSource = new MatTableDataSource<GetPractitionerScheduleDTO>([]);

    // Private State
    private updateData: GetPractitionerScheduleDTO[] = [];

    // ViewChild References
    @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
    @ViewChild(MatSort) private readonly sort!: MatSort;

    // Injected Services
    private readonly masterDataService = inject(MasterDataService);
    private readonly scheduleService = inject(PractitionerSchedulesService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly destroyRef = inject(DestroyRef);

    // Lifecycle Hooks
    public ngAfterViewInit(): void {
        console.log("value", this.masterDataService.patientsSubject.value)
        this.setupPatientSubscription();
        this.setupScheduleSubscription();
        this.initializeDataSource();
    }

    private setupPatientSubscription(): void {
        this.patientIdControl.valueChanges.pipe(
            startWith(this.patientIdControl.value),  // Emit initial value
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef),
            map(patientId => patientId ?? 0),
            map(patientId => this.patients().find(p => p.patientId === patientId))
        ).subscribe(patient => {
            if (patient) {
                this.selectedPatient.set(patient as UserProfile);
            }
        });
    }

    private setupScheduleSubscription(): void {
        merge(this.patientIdControl.valueChanges, this.workDayControl.valueChanges)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.isLoadingResults.set(true);
                    return this.fetchScheduleData();
                }),
                map(this.processScheduleResponse.bind(this)),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(data => {
                this.isLoadingResults.set(false);
                this.dataSource.data = data ?? [];
                this.initializeDataSource();
            });
    }

    private fetchScheduleData() {
        const workDate = this.workDayControl.value;
        const patientId = this.patientIdControl.value;

        if (!workDate || ((patientId ?? 0) === 0)) {
            this.isLoadingResults.set(false);
            return observableOf(null);
        }

        this.isLoadingResults.set(true);
        // Format the date according to API requirements
        const formattedDate = workDate.toISOString();

        return this.scheduleService.apiPractitionerSchedulesByDateGet(formattedDate)
            .pipe(catchError(() => observableOf(null)));
    }

    private processScheduleResponse(response: any) {
        this.isLoadingResults.set(false);
        return response?.data ?? [];
    }

    private initializeDataSource(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    private updateSchedule(data: GetPractitionerScheduleDTO) {
        const newEntity: AddPractitionerScheduleDTO = { ...data };
        return this.scheduleService.apiPractitionerSchedulesPut(newEntity).pipe(
            tap(() => console.log(`Updated schedule for patient: ${data.patientId}`)),
            catchError((error) => {
                console.error('Error updating schedule:', error);
                return observableOf(null);
            })
        );
    }

    private updateScheduleArray(dataArray: GetPractitionerScheduleDTO[]) {
        let successCount = 0;
        let errorCount = 0;

        from(dataArray).pipe(
            concatMap((item) =>
                this.updateSchedule(item).pipe(
                    tap((response) => {
                        response ? successCount++ : errorCount++;
                    })
                )
            ),
            finalize(() => this.handleUpdateCompletion(successCount, errorCount)),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    private handleUpdateCompletion(successCount: number, errorCount: number): void {
        if (errorCount === 0) {
            this.snackbarService.show('All appointments updated successfully!', 'success-snackbar');
            this.updateData = [];
        } else {
            this.snackbarService.show('Some appointments failed to update.', 'error-snackbar');
        }
    }

    // Public Methods
    protected onPatientChange(event: MatSelectChange): void {
        const id = event.value;
        const patient = this.patients().find((p) => p.patientId === id);
        if (patient) {
            this.selectedPatient.set(patient as UserProfile);
        }
    }

    protected onCancel(element: GetPractitionerScheduleDTO): void {
        element.patientId = 0;
        element.patientName = "";
        this.updateScheduleElement(element);
    }

    protected onAssign(element: GetPractitionerScheduleDTO): void {
        element.patientId = this.patientId$();
        element.patientName = `${this.selectedPatient().firstName} ${this.selectedPatient().lastName}`;
        this.updateScheduleElement(element);
    }

    private updateScheduleElement(element: GetPractitionerScheduleDTO): void {
        const idx = this.updateData.findIndex(e => e.scheduleId === element.scheduleId);
        if (idx >= 0) {
            this.updateData[idx] = { ...element };
        } else {
            this.updateData.push({ ...element });
        }
    }

    protected saveSchedule(): void {
        if (this.updateData.length > 0) {
            this.updateScheduleArray(this.updateData);
        } else {
            this.snackbarService.show('No changes to save.');
        }
    }
}
