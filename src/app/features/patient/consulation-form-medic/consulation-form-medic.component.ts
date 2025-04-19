import { 
  AfterViewInit, 
  ChangeDetectionStrategy, 
  Component, 
  DestroyRef, 
  computed,
  inject, 
  OnInit, 
  signal, 
  ViewChild 
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GetMedicationDTO, MedicationsService } from '@libs/api-client';
import { toSignal } from '@angular/core/rxjs-interop';

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
    styleUrl: './consulation-form-medic.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsulationFormMedicComponent implements OnInit, AfterViewInit {
  // ViewChild decorators
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
  @ViewChild(MatSort) private readonly sort!: MatSort;

  // Public properties
  protected readonly displayedColumns: readonly string[] = ['no', 'medicationId', 'medicationName', 'dosage', 'action'];
  protected readonly dataSource = new MatTableDataSource<GetMedicationDTO>([]);
  protected readonly medicationControl = new FormControl<string | GetMedicationDTO>('');

  // Signals
  private readonly allMedications = signal<GetMedicationDTO[]>([]);
  private readonly selectedMedication = signal<GetMedicationDTO>({});
  private readonly searchTerm = toSignal(this.medicationControl.valueChanges, { initialValue: '' });

  // Computed signal for filtered medications
  protected readonly filterMedications = computed(() => {
    const term = this.searchTerm();
    const name = typeof term === 'string' ? term : term?.name;
    
    if (!name) {
      return this.allMedications();
    }

    const filterValue = name.toLowerCase();
    return this.allMedications().filter(option => 
      option.name?.toLowerCase().includes(filterValue)
    );
  });

  // Private properties
  private readonly destroyRef = inject(DestroyRef);
  private readonly medicationService = inject(MedicationsService);

  ngOnInit(): void {
    this.loadMedications();
  }

  ngAfterViewInit(): void {
    this.initializeTableControls();
  }

  // Public methods
  protected onMedicationSelected(event: { option: { value: GetMedicationDTO } }): void {
    const selectedMed = event.option.value;
    this.selectedMedication.set(selectedMed);
    this.addMedicationToTable(this.selectedMedication());
  }

  protected applyFilterTable(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dataSource.filter = input.value.trim().toLowerCase();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  protected displayFn(med: GetMedicationDTO): string {
    return med?.name ?? '';
  }

  protected removeMedication(index: number): void {
    const data = [...this.dataSource.data];
    data.splice(index, 1);
    this.dataSource.data = data;
  }

  // Public API methods
  public getMedications(): GetMedicationDTO[] {
    return this.dataSource.data;
  }

  public resetMedication(): void {
    this.dataSource.data = [];
  }

  // Private methods
  private loadMedications(): void {
    this.medicationService.apiMedicationsGet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.data) {
            this.allMedications.set(res.data);
          }
        },
        error: (err) => console.error('Failed to load medications:', err)
      });
  }

  private initializeTableControls(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private addMedicationToTable(medication: GetMedicationDTO): void {
    this.dataSource.data = [...this.dataSource.data, { ...medication }];
  }
}

