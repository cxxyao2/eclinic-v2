// Angular Core Imports
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ViewChild, inject, signal, resource, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, finalize, from, map, merge, of as observableOf, startWith, switchMap, firstValueFrom } from 'rxjs';

// Third-Party Libraries
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Application-Specific Imports
import { AddPractitionerScheduleDTO, GetPractitionerDTO, GetPractitionerScheduleDTO, PractitionerSchedulesService } from '@libs/api-client';
import { ProfileComponent } from '@shared/components/profile/profile.component';
import { SCHEDULE_DURATION } from '@shared/constants/system-settings.constants';
import { MasterDataService } from '@core/services/master-data.service';
import { SnackbarService } from '@core/services/snackbar-service.service';
import { DialogSimpleDialog } from '@shared/components/dialog/dialog-simple-dialog';
import { addMinutesToDate, formatDateToHHmm, formatDateToYyyyMmDdPlus, getDayOfWeek } from '@shared/utils/date-helpers';
import { HttpErrorResponse } from '@angular/common/http';


interface GetPractitionerScheduleDTOExtended extends GetPractitionerScheduleDTO {
  day: string;
  fromTime: string;
  endTime: string;
}

@Component({
  selector: 'app-practitioner-schedule',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
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
  templateUrl: './practitioner-schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PractitionerScheduleComponent implements AfterViewInit {
  // ViewChild References
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Constants
  protected readonly SCHEDULE_DURATION = SCHEDULE_DURATION;
  protected readonly columnHeaders: Readonly<Record<string, string>> = {
    day: 'Day',
    fromTime: 'From Time',
    endTime: 'End Time'
  };

  // Service Injections
  private readonly masterDataService = inject(MasterDataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly scheduleService = inject(PractitionerSchedulesService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals and State
  protected readonly imagePath = signal('assets/images/smiling-doctor.jpg');
  protected readonly practitioners = signal<GetPractitionerDTO[]>([]);
  protected readonly selectedPractitioner = signal<GetPractitionerDTO>({} as GetPractitionerDTO);

  // Form Controls
  protected readonly workDayControl = new FormControl<Date | null>(new Date());
  protected readonly practitionerIdControl = new FormControl<number | null>(0);
  protected readonly workDay$ = toSignal(this.workDayControl.valueChanges, { initialValue: new Date() });
  protected readonly practitionerId$ = toSignal(this.practitionerIdControl.valueChanges, { initialValue: 0 });

  // Table Data
  protected readonly dataSource = new MatTableDataSource<GetPractitionerScheduleDTOExtended>([]);
  protected readonly displayedColumns: readonly string[] = ['day', 'fromTime', 'endTime'];

  // Protected Properties
  protected readonly errorMessage = signal<string>('');
  protected isLoadingResults = signal<boolean>(false);

  // Private Properties
  private addedData: GetPractitionerScheduleDTO[] = [];
  private readonly deletedData: GetPractitionerScheduleDTO[] = [];





  ngAfterViewInit() {
    this.initializePractitionerData();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Reset to first page when sort changes
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(
      this.practitionerIdControl.valueChanges,
      this.workDayControl.valueChanges
    ).pipe(
      startWith({}),
      switchMap(() => {
        this.isLoadingResults.set(true);
        this.errorMessage.set('');

        if (!this.practitionerIdControl.value || !this.workDayControl.value) {
          return observableOf(null);
        }

        // Format the date as YYYY-MM-DD
        const formattedDate = formatDateToYyyyMmDdPlus(this.workDayControl.value);

        return this.scheduleService.apiPractitionerSchedulesGet(
          this.practitionerIdControl.value,
          formattedDate
        ).pipe(
          catchError((error) => {
            this.errorMessage.set(error.error?.message || JSON.stringify(error.errors) || 'Failed to load schedules');
            console.error('Failed to load schedules:', error);
            return observableOf(null);
          })
        );
      }),
      map(response => {
        this.isLoadingResults.set(false);
        if (response === null) {
          return {
            data: [],
            total: 0
          };
        }

        return {
          data: response.data?.map(schedule => ({
            ...schedule,
            day: getDayOfWeek(new Date(schedule.startDateTime!)),
            fromTime: formatDateToHHmm(schedule.startDateTime!),
            endTime: formatDateToHHmm(schedule.endDateTime!)
          })),
          total: response.data?.length || 0
        };
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.dataSource.data = result.data || [];
    });
  }



  protected onPractitionerChange(event: MatSelectChange): void {
    const id = event.value;
    const practitioner = this.practitioners().find((p) => p.practitionerId === id);

    if (practitioner) {
      this.selectedPractitioner.set(practitioner);
    }
  }

  protected saveSchedule(): void {
    this.errorMessage.set('');
    this.isLoadingResults.set(true);

    const newData = this.dataSource.data.filter((entity) => (entity.scheduleId ?? 0) === 0);
    if (newData.length > 0) {
      this.addScheduleBatch(newData);
    }

    if (this.deletedData.length > 0) {
      this.deleteScheduleBatch(this.deletedData);
    }
  }

  protected onDeleteSchedule(): void {
    const dialogRef = this.dialog.open(DialogSimpleDialog, {
      data: {
        title: 'Confirm Action',
        content: 'Are you sure you want to delete? All unsaved changes will be lost.',
        isCancelButtonVisible: true
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result !== undefined) {
          this.deletedData.push(...this.dataSource.data.filter((entity) => (entity.scheduleId ?? 0) > 0));
          this.dataSource.data = [];
        }
      });
  }

  private initializePractitionerData(): void {
    this.masterDataService.practitionersSubject
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.practitioners.set(data),
        error: (error) => console.error('Failed to load practitioners:', error)
      });
  }


  private deleteScheduleBatch(dataArray: GetPractitionerScheduleDTO[]) {
    if (dataArray.length === 0) return;

    this.isLoadingResults.set(true);
    const scheduleIds = dataArray.map(item => item.scheduleId!);

    this.scheduleService.apiPractitionerSchedulesBatchDeletePost(scheduleIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.snackbarService.show('Schedules deleted successfully', 'success-snackbar');
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(err.error?.message || 'Failed to delete schedules');
          console.error('Batch delete operation failed:', err);
        },
        complete: () => {
          this.isLoadingResults.set(false);
          this.resetDataState();
        }
      });
  }


  private resetDataState(): void {
    this.dataSource.data = [];
    this.addedData.length = 0;
    this.deletedData.length = 0;
    this.practitionerIdControl.setValue(0, { onlySelf: true });
  }

  createSchedule(): void {
    const workDate = this.workDay$();
    const practitionerId = this.practitionerId$();
    if (!workDate || ((practitionerId ?? 0) === 0)) {
      this.openDataInvalidDialog();
      return;
    }

    const startDate = formatDateToYyyyMmDdPlus(workDate, '00:00:00');
    const endDate = formatDateToYyyyMmDdPlus(workDate, '23:30:00');
    const availabilitySlots = this.generatePractitionerScheduleSlots(startDate, endDate, this.SCHEDULE_DURATION, practitionerId || 0);

    this.addedData = [...availabilitySlots];

    this.dataSource.data = availabilitySlots.map(schedule => ({
      ...schedule,
      day: getDayOfWeek(new Date(schedule.startDateTime!)),
      fromTime: formatDateToHHmm(schedule.startDateTime!),
      endTime: formatDateToHHmm(schedule.endDateTime!)
    }));
  }

  generatePractitionerScheduleSlots(
    startDate: string,
    endDate: string,
    duration: number,
    practitionerId: number
  ): AddPractitionerScheduleDTO[] {
    const slots: AddPractitionerScheduleDTO[] = [];
    let currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);

    while (currentDate < endDateTime) {
      slots.push({
        practitionerId,
        startDateTime: new Date(currentDate),
        endDateTime: addMinutesToDate(currentDate, SCHEDULE_DURATION),
        reasonForVisit: 'Urgenet'
      });
      currentDate = new Date(currentDate.getTime() + duration * 60 * 1000);
    }

    return slots;
  }

  // Dialogs
  openDataInvalidDialog(): void {
    this.dialog.open(DialogSimpleDialog, {
      data: { title: 'Notification', content: 'Please select practitioner and date first.', isCancelButtonVisible: false },
    });
  }

  openNoPrintDataDialog(): void {
    this.dialog.open(DialogSimpleDialog, {
      data: { title: 'Notification', content: 'No data to print.', isCancelButtonVisible: false },
    });
  }

  printSchedule(): void {
    if (this.dataSource.data.length === 0) {
      this.openNoPrintDataDialog();
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Practitioner Schedule', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(
      formatDateToYyyyMmDdPlus(this.workDay$()!)
      + ' '
      + this.selectedPractitioner().firstName!
      + ' '
      + this.selectedPractitioner().lastName!,
      105,
      30,
      { align: 'center' });

    const columns = ['Day', 'From Time', 'End Time'];
    const rows = this.dataSource.data.map((slot) => [
      getDayOfWeek(new Date(slot.startDateTime!)),
      formatDateToHHmm(slot.startDateTime!),
      formatDateToHHmm(slot.endDateTime!)]);

    (doc as any).autoTable({ head: [columns], body: rows, startY: 40, theme: 'grid' });
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank')?.print();
  }

  private addScheduleBatch(schedulesToAdd: AddPractitionerScheduleDTO[]) {
    if (schedulesToAdd.length === 0) return;

    this.isLoadingResults.set(true);

    this.scheduleService.apiPractitionerSchedulesBatchAddPost(schedulesToAdd)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.show('Schedules added successfully', 'success-snackbar');
            // Refresh data or update UI as needed
          } else {
            this.errorMessage.set(response.message || 'Failed to add schedules');
          }
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(err.error?.message || 'Failed to add schedules');
          console.error('Batch add operation failed:', err);
        },
        complete: () => {
          this.isLoadingResults.set(false);
          this.resetDataState();
        }

      });
  }

}
