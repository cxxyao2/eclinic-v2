import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, ViewChild, type AfterViewInit, type OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  AddVisitRecordDTO,
  GetPatientDTO,
  GetPractitionerScheduleDTO,
  GetPractitionerScheduleDTOListServiceResponse,
  GetVisitRecordDTO,
  GetVisitRecordDTOListServiceResponse,
  GetVisitRecordDTOServiceResponse,
  PractitionerSchedulesService,
  UpdatePractitionerScheduleDTO,
  VisitRecordsService
} from '@libs/api-client';
import { MasterDataService } from '@services/master-data.service';
import { CheckInWaitingListComponent } from '../check-in-waiting-list/check-in-waiting-list.component';
import { formatDateToYyyyMmDdPlus } from '@shared/utils/date-helpers';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-check-in',
  standalone: true,
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
    CheckInWaitingListComponent
  ],
  templateUrl: './check-in.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckInComponent implements AfterViewInit, OnInit {
  // ViewChild
  @ViewChild(MatSort) private readonly sort!: MatSort;
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;

  // Injected Services
  private readonly masterService = inject(MasterDataService);
  private readonly visitService = inject(VisitRecordsService);
  private readonly scheduleService = inject(PractitionerSchedulesService);
  private readonly destroyRef = inject(DestroyRef);

  // Public Properties
  public readonly displayedColumns: readonly string[] = ['practitionerName', 'startDateTime', 'action', 'endDateTime'];
  public readonly today = new Date(formatDateToYyyyMmDdPlus(new Date(), '00:00:00'));
  public readonly patientIdControl = new FormControl<number | null>(0);
  public readonly dataSource = new MatTableDataSource<GetPractitionerScheduleDTO>();
  public readonly waitingList = signal<GetVisitRecordDTO[]>([]);
  public readonly patients = signal<GetPatientDTO[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string>('');


  // Private Properties
  private todayAllSchedules: GetPractitionerScheduleDTO[] = [];

  public ngOnInit(): void {
    this.getAppointmentByDate(this.today);
    this.getWaitingListByDate(this.today);

    // Subscribe to patient ID control changes
    this.patientIdControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(patientId => {
        this.filterAppointmentsByPatient(patientId ?? 0);
      });
  }

  public ngAfterViewInit(): void {
    this.masterService.patientsSubject$
      .pipe(takeUntilDestroyed())
      .subscribe(data => this.patients.set(data));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private filterAppointmentsByPatient(patientId: number): void {
    if (patientId === 0) {
      // If no patient is selected, show all appointments
      this.dataSource.data = this.todayAllSchedules;
    } else {
      // Filter appointments by patient ID
      const filteredData = this.todayAllSchedules.filter(schedule => schedule.patientId === patientId);
      this.dataSource.data = filteredData;
    }
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  public addWaitingList(schedule: GetPractitionerScheduleDTO): void {
    this.errorMessage.set('');
    this.updateSchedule(schedule);
    this.addToWaitingList(schedule);
  }

  private getAppointmentByDate(bookedDate: Date): void {
    const formattedDate = bookedDate.toISOString();
    this.isLoading.set(true);
    this.scheduleService.apiPractitionerSchedulesByDateGet(formattedDate)
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: GetPractitionerScheduleDTOListServiceResponse) => {
          const result = res.data ?? [];
          console.log('result', result.filter(res => (res.patientId ?? 0) > 1));
          this.todayAllSchedules = result.filter(res => res.reasonForVisit !== 'done');
        },
        error: (err) => {
          console.log('error', err);
        }
      });
  }

  private getWaitingListByDate(bookedDate: Date): void {
    const formatedDate = bookedDate.toISOString();
    this.isLoading.set(true);
    this.visitService.apiVisitRecordsWaitingListGet(formatedDate)
      .pipe(takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: GetVisitRecordDTOListServiceResponse) => {
          this.waitingList.set(res.data ?? []);
        },
        error: (err) => {
          this.waitingList.set([]);
          console.log('error', err);
        }
      });
  }

  private updateSchedule(schedule: GetPractitionerScheduleDTO): void {
    const newSchedule: UpdatePractitionerScheduleDTO = {
      ...schedule,
      reasonForVisit: 'done'
    };

    this.isLoading.set(true);
    this.scheduleService.apiPractitionerSchedulesPut(newSchedule)
      .pipe(takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => console.log('updated', data),
        error: (err) => {
          this.errorMessage.set(this.errorMessage() + err.error?.message || 'Failed to update schedule');
          console.error('error is', err)
        },
      });
  }

  private addToWaitingList(schedule: GetPractitionerScheduleDTO): void {
    const newVisit: AddVisitRecordDTO = this.createVisitRecord(schedule);
    const newWaiting: GetVisitRecordDTO = this.createWaitingRecord(schedule);

    this.isLoading.set(true);
    this.visitService.apiVisitRecordsPost(newVisit)
      .pipe(takeUntilDestroyed(),
        finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (rep: GetVisitRecordDTOServiceResponse) => {
          this.updateDataSource(schedule.scheduleId ?? 0);  //todo. should > 0
          this.updateWaitingList(rep.data?.visitId ?? 0, newWaiting);
        },
        error: (err) => {
          this.errorMessage.set(this.errorMessage() + err.error?.message || 'Failed to update schedule');
          console.error('error is', err)
        },
      });
  }

  private createVisitRecord(schedule: GetPractitionerScheduleDTO): AddVisitRecordDTO {
    return {
      patientId: schedule.patientId ?? 0,
      practitionerId: schedule.practitionerId,
      scheduleId: schedule.scheduleId,
      practitionerSignaturePath: "",
      visitDate: new Date(),
      diagnosis: "",
      treatment: "",
      notes: ""
    };
  }

  private createWaitingRecord(schedule: GetPractitionerScheduleDTO): GetVisitRecordDTO {
    return {
      patientId: schedule.patientId ?? 0,
      patientName: schedule.patientName,
      practitionerId: schedule.practitionerId,
      practitionerName: schedule.practitionerName,
      scheduleId: schedule.scheduleId,
      practitionerSignaturePath: "",
      visitDate: new Date(),
      diagnosis: "",
      treatment: "",
      notes: ""
    };
  }

  private updateDataSource(scheduleId: number): void {
    const newData = this.dataSource.data.filter(ele => ele.scheduleId !== scheduleId);
    this.dataSource.data = newData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateWaitingList(visitId: number, newWaiting: GetVisitRecordDTO): void {
    newWaiting.visitId = visitId;
    this.waitingList.set([...this.waitingList(), newWaiting]);
  }
}
