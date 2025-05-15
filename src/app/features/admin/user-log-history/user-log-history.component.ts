import { Component, DestroyRef, ViewChild, inject, OnInit, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserLogHistory, UserLogHistoryService } from '@libs/api-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



@Component({
  selector: 'app-user-log-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './user-log-history.component.html'
})
export class UserLogHistoryComponent implements OnInit, AfterViewInit {
  // Public properties for template binding
  public readonly displayedColumns: string[] = ['userId', 'userName', 'loginTime', 'logoutTime', 'ipAddress'];
  public readonly dataSource = new MatTableDataSource<UserLogHistory>();
  public readonly isLoading = signal<boolean>(false);

  // ViewChild decorators
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  // Dependency injection
  private readonly userLogHistoryService = inject(UserLogHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  // Lifecycle hooks
  public ngOnInit(): void {
    this.loadUserLogHistory();
  }

  public ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Public methods
  public applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Private methods
  private loadUserLogHistory(): void {
    this.isLoading.set(true);
    this.userLogHistoryService.apiUserLogHistoryGet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data as UserLogHistory[];
        },
        error: (error) => {
          console.error('Error fetching user log history:', error);
        },
        complete: () => this.isLoading.set(false)
      });
  }
}
