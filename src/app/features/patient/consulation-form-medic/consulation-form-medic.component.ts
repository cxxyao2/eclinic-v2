import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
  effect,
  DestroyRef
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GetMedicationDTO } from '@libs/api-client';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConsultationService } from '../services/consultation.service';
import { MasterDataService } from '@core/services/master-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-consulation-form-medic',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatAutocompleteModule
  ],
  templateUrl: './consulation-form-medic.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsulationFormMedicComponent implements AfterViewInit {
  // ViewChild decorators
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
  @ViewChild(MatSort) private readonly sort!: MatSort;

  // Public properties
  protected readonly displayedColumns: readonly string[] = ['no', 'medicationId', 'medicationName', 'dosage', 'action'];
  protected readonly dataSource = new MatTableDataSource<GetMedicationDTO>([]);
  protected readonly medicationControl = new FormControl<string | GetMedicationDTO>('');

  // Private properties
  private readonly consultationService = inject(ConsultationService);
  private readonly masterService = inject(MasterDataService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals
  private readonly allMedications = this.masterService.medicationsSubject$;
  private readonly selectedMedication = signal<GetMedicationDTO>({});
  private readonly searchTerm = toSignal(
    this.medicationControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(value => typeof value === 'string' ? value : value?.name || '')
    ),
    { initialValue: '' }
  );

  // Computed signal for filtered medications
  protected readonly filterMedications = computed(() => {
    const term = this.searchTerm();
    const name = typeof term === 'string' ? term : (term as GetMedicationDTO)?.name;

    if (!name) {
      return this.allMedications.value;
    }

    const filterValue = name.toLowerCase();
    return this.allMedications.value.filter(option =>
      option.name?.toLowerCase().includes(filterValue)
    );
  });

  constructor() {
    // Sync the dataSource with the prescriptions from the service
    effect(() => {
      const prescriptions = this.consultationService.prescriptions();
      this.dataSource.data = [...prescriptions];
    });

    // Subscribe to currentVisit changes
    this.subscribeToVisitChanges();
  }

  ngAfterViewInit(): void {
    this.initializeTableControls();
  }

  // Private methods
  private subscribeToVisitChanges(): void {
    this.consultationService.currentVisit$
      .pipe(takeUntilDestroyed())
      .subscribe(visit => {
        if (visit === null) {
          this.dataSource.data = [];
          this.initializeTableControls();
        }
      });
  }

  // Public methods
  protected onMedicationSelected(event: { option: { value: GetMedicationDTO } }): void {
    const selectedMed = event.option.value;
    this.selectedMedication.set(selectedMed);
    this.addMedicationToTable(selectedMed);
    this.medicationControl.setValue(''); // Clear the input after selection
  }


  protected displayFn(med: GetMedicationDTO): string {
    return med?.name ?? '';
  }

  protected removeMedication(index: number): void {
    const data = [...this.dataSource.data];
    data.splice(index, 1);
    this.dataSource.data = data;
    this.initializeTableControls();
    // Sync with service
    this.consultationService.removePrescription(index);
  }

  private initializeTableControls(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private addMedicationToTable(medication: GetMedicationDTO): void {
    this.dataSource.data = [...this.dataSource.data, { ...medication }];
    this.initializeTableControls();
    // Sync with service
    this.consultationService.addPrescription({ ...medication });
  }
}

