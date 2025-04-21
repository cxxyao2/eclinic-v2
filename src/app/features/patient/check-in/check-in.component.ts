import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, ViewChild, type AfterViewInit, type OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckInComponent implements AfterViewInit, OnInit {
  // ViewChild
  @ViewChild(MatSort) private readonly sort!: MatSort;

  // Injected Services
  private readonly masterService = inject(MasterDataService);
  private readonly visitService = inject(VisitRecordsService);
  private readonly scheduleService = inject(PractitionerSchedulesService);
  private readonly destroyRef = inject(DestroyRef);

  // Public Properties
  public readonly displayedColumns: readonly string[] = ['practitionerName', 'startDateTime', 'endDateTime', 'action'];
  public readonly today = new Date();
  public readonly patientIdControl = new FormControl<number | null>(0);
  public readonly dataSource = new MatTableDataSource<GetPractitionerScheduleDTO>();
  public readonly waitingList = signal<GetVisitRecordDTO[]>([]);
  public readonly patients = signal<GetPatientDTO[]>([]);

  // Private Properties
  private todayAllSchedules: GetPractitionerScheduleDTO[] = [];

  public ngOnInit(): void {
    this.getAppointmentByDate(this.today);
    this.getWaitingListByDate(this.today);
  }

  public ngAfterViewInit(): void {
    this.masterService.patientsSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.patients.set(data));

    this.dataSource.sort = this.sort;
  }

  public getPatientAppointment(): void {
    const patientId = this.patientIdControl.getRawValue() ?? 0;
    const filteredData = this.todayAllSchedules.filter(ele => ele.patientId === patientId);
    this.dataSource.data = filteredData;
  }

  public addWaitingList(schedule: GetPractitionerScheduleDTO): void {
    this.updateSchedule(schedule);
    this.addToWaitingList(schedule);
  }

  private getAppointmentByDate(bookedDate: Date): void {
    const formattedDate = bookedDate.toISOString();
    this.scheduleService.apiPractitionerSchedulesByDateGet(formattedDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: GetPractitionerScheduleDTOListServiceResponse) => {
          const result = res.data ?? [];
          this.todayAllSchedules = result.filter(res => res.reasonForVisit !== 'done');
        },
        error: () => { }
      });
  }

  private getWaitingListByDate(bookedDate: Date): void {
    const formatedDate = formatDateToYyyyMmDdPlus(bookedDate);

    this.visitService.apiVisitRecordsWaitingListGet(formatedDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: GetVisitRecordDTOListServiceResponse) => {
          this.waitingList.set(res.data ?? []);
        },
        error: () => { }
      });
  }

  private updateSchedule(schedule: GetPractitionerScheduleDTO): void {
    const newSchedule: UpdatePractitionerScheduleDTO = {
      ...schedule,
      reasonForVisit: 'done'
    };

    this.scheduleService.apiPractitionerSchedulesPut(newSchedule)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => console.log('updated', data),
        error: (err) => console.error('error is', err)
      });
  }

  private addToWaitingList(schedule: GetPractitionerScheduleDTO): void {
    const newVisit: AddVisitRecordDTO = this.createVisitRecord(schedule);
    const newWaiting: GetVisitRecordDTO = this.createWaitingRecord(schedule);

    this.visitService.apiVisitRecordsPost(newVisit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rep: GetVisitRecordDTOServiceResponse) => {
          this.updateDataSource(schedule.scheduleId ?? 0);  //todo. should > 0
          this.updateWaitingList(rep.data?.visitId ?? 0, newWaiting);
        },
        error: (err) => console.error(err)
      });
  }

  private createVisitRecord(schedule: GetPractitionerScheduleDTO): AddVisitRecordDTO {
    return {
      patientId: schedule.patientId ?? 0,
      practitionerId: schedule.practitionerId,
      scheduleId: schedule.scheduleId,
      practitionerSignaturePath: "",
      visitDate: this.today,
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
      visitDate: this.today,
      diagnosis: "",
      treatment: "",
      notes: ""
    };
  }

  private updateDataSource(scheduleId: number): void {
    const newData = this.dataSource.data.filter(ele => ele.scheduleId !== scheduleId);
    this.dataSource.data = newData;
  }

  private updateWaitingList(visitId: number, newWaiting: GetVisitRecordDTO): void {
    newWaiting.visitId = visitId;
    this.waitingList.set([...this.waitingList(), newWaiting]);
  }
}
