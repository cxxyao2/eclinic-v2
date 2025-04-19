import { Component, DestroyRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserLogHistoryService } from '@libs/api-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface UserLogHistory {
  userId: number;
  userName: string;
  loginTime: Date;
  logoutTime: Date | null;
  ipAddress: string;
}

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
export class UserLogHistoryComponent implements OnInit {
  displayedColumns: string[] = ['userId', 'userName', 'loginTime', 'logoutTime', 'ipAddress'];
  dataSource = new MatTableDataSource<UserLogHistory>();
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly userLogHistoryService = inject(UserLogHistoryService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadUserLogHistory();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private loadUserLogHistory(): void {
    this.isLoading = true;
    this.userLogHistoryService.apiUserLogHistoryGet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data as UserLogHistory[];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching user log history:', error);
          this.isLoading = false;
        }
      });
  }
}
