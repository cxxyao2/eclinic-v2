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
import { addMinutesToDate, formatDateToHHmm, formatDateToYMDPlus, getDayOfWeek } from '@shared/utils/date-helpers';

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
  // Constants
  protected readonly SCHEDULE_DURATION = SCHEDULE_DURATION;
  protected readonly columnHeaders: Readonly<Record<string, string>> = {
    day: 'Day',
    fromTime: 'From Time',
    endTime: 'End Time'
  };

  // Signals and State
  protected readonly imagePath = signal('assets/images/smiling-doctor.jpg');
  protected readonly savedFlag = signal(false);
  protected readonly practitioners = signal<GetPractitionerDTO[]>([]);
  protected readonly selectedPractitioner = signal<GetPractitionerDTO>({} as GetPractitionerDTO);

  // Form Controls
  protected readonly workDayControl = new FormControl<Date | null>(new Date());
  protected readonly practitionerIdControl = new FormControl<number | null>(0);
  protected readonly workDay$ = toSignal(this.workDayControl.valueChanges, { initialValue: new Date() });
  protected readonly practitionerId$ = toSignal(this.practitionerIdControl.valueChanges, { initialValue: 0 });

  // Table Data
  protected readonly scheduleData = signal<GetPractitionerScheduleDTO[]>([]);

  // // Computed dataSource from scheduleData signal
  // protected readonly dataSource = computed(() => {
  //   const tableData = new MatTableDataSource(this.scheduleData().values());
  //   tableData.paginator = this.paginator;
  //   tableData.sort = this.sort;
  //   return tableData;
  // });

  protected readonly displayedColumns: readonly string[] = ['day', 'fromTime', 'endTime'];


  // Private Properties
  private readonly initialData: GetPractitionerScheduleDTO[] = [];
  private changedData: GetPractitionerScheduleDTO[] = [];
  private readonly deletedData: GetPractitionerScheduleDTO[] = [];

  // ViewChild References
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
  @ViewChild(MatSort) private readonly sort!: MatSort;

  // Service Injections
  private readonly masterDataService = inject(MasterDataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackbarService = inject(SnackbarService);
  private readonly scheduleService = inject(PractitionerSchedulesService);
  private readonly destroyRef = inject(DestroyRef);

  // Create computed signal for request parameters
  private readonly scheduleParams = computed(() => ({
    practitionerId: this.practitionerIdControl.value,
    workDate: this.workDayControl.value
  }));

  // Replace fetchScheduleData with resource
  protected readonly scheduleResource = resource<GetPractitionerScheduleDTO[], { practitionerId: number | null, workDate: Date | null }>({
    request: () => this.scheduleParams(),
    loader: async ({ request }) => {
      if (!request.practitionerId || !request.workDate) {
        return [];
      }
      const response = await firstValueFrom(
        this.scheduleService.apiPractitionerSchedulesGet(
          request.practitionerId,
          new Date(request.workDate)
        )
      );
      return response?.data ?? [];
    }
  });

  public ngAfterViewInit(): void {
    this.initializePractitionerData();
  }

  protected onPractitionerChange(event: MatSelectChange): void {
    const id = event.value;
    const practitioner = this.practitioners().find((p) => p.practitionerId === id);

    if (practitioner) {
      this.selectedPractitioner.set(practitioner);
    }
  }

  protected saveSchedule(): void {
    this.savedFlag.set(false);

    const newData = this.scheduleData().filter((entity) => (entity.scheduleId ?? 0) === 0);
    if (newData.length > 0) {
      this.addNewSchedules(newData);
    }

    if (this.deletedData.length > 0) {
      this.deleteScheduleArray(this.deletedData);
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
          this.deletedData.push(...this.scheduleData().filter((entity) => (entity.scheduleId ?? 0) > 0));
          this.scheduleData.set([]);
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


  private addOneSchedule(data: GetPractitionerScheduleDTO) {
    const newEntity: AddPractitionerScheduleDTO = { ...data };

    return this.scheduleService.apiPractitionerSchedulesPost(newEntity).pipe(
      catchError((error) => {
        console.error(`Error posting schedule:`, error);
        return observableOf(null);
      })
    );
  }

  private deleteScheduleArray(dataArray: GetPractitionerScheduleDTO[]) {
    this.savedFlag.set(true);

    from(dataArray).pipe(
      concatMap((item) => this.scheduleService.apiPractitionerSchedulesIdDelete(item.scheduleId!)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      error: (err) => console.error('Delete operation failed:', err),
    });
  }

  private addNewSchedules(dataArray: GetPractitionerScheduleDTO[]) {
    let recordCount = 0;
    this.savedFlag.set(true);

    from(dataArray).pipe(
      concatMap((item) => this.addOneSchedule(item)),
      finalize(() => this.handleAddNewSchedulesCompletion(recordCount, dataArray.length)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => recordCount++,
      error: (err) => console.error('Add operation failed:', err),
    });
  }

  private handleAddNewSchedulesCompletion(recordCount: number, totalRecords: number): void {
    if (recordCount === totalRecords) {
      this.snackbarService.show('All items processed successfully!', 'success-snackbar');
      this.resetDataState();
    } else {
      this.snackbarService.show('Some items failed to process.', 'error-snackbar');
    }
  }

  private resetDataState(): void {
    this.scheduleData.set([]);
    this.changedData.length = 0;
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


    const startDate = formatDateToYMDPlus(workDate, '00:00:00');
    const endDate = formatDateToYMDPlus(workDate, '23:30:00');
    const availabilitySlots = this.generatePractitionerScheduleSlots(startDate, endDate, this.SCHEDULE_DURATION, practitionerId || 0);

    this.changedData = [...availabilitySlots];
    this.scheduleData.set(availabilitySlots);
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
    if (this.scheduleData().length === 0) {
      this.openNoPrintDataDialog();
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('Practitioner Schedule', 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(
      formatDateToYMDPlus(this.workDay$()!)
      + ' '
      + this.selectedPractitioner().firstName!
      + ' '
      + this.selectedPractitioner().lastName!,
      105,
      30,
      { align: 'center' });

    const columns = ['Day', 'From Time', 'End Time'];
    const rows = this.scheduleData().map((slot) => [
      getDayOfWeek(new Date(slot.startDateTime!)),
      formatDateToHHmm(slot.startDateTime!),
      formatDateToHHmm(slot.endDateTime!)]);

    (doc as any).autoTable({ head: [columns], body: rows, startY: 40, theme: 'grid' });
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank')?.print();
  }
}
