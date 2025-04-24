import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { User, UserRole, UsersService } from '@libs/api-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, finalize, from } from 'rxjs';
import { Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';


@Component({
  selector: 'app-authorization',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatTableModule, MatSortModule, MatPaginatorModule,],
  templateUrl: './authorization.component.html',
})
export class AuthorizationComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['userID', 'userName', 'role'];
  dataSource = new MatTableDataSource<User>([]);
  originalData: User[] = [];
  userRoles = Object.entries(UserRole).map(([text, value]) => ({ text, value }));
  private userService = inject(UsersService);
  private router = inject(Router);
  destroyRef = inject(DestroyRef);
  resultsLength = 0;

  ngOnInit(): void {
    this.userService.apiUsersGet().
      pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.resultsLength = data.length;
        this.originalData = JSON.parse(JSON.stringify(data));
      });
  }

  save(): void {
    const updatedData = this.dataSource.data.filter((current, index) => {
      const original = this.originalData[index];
      return current.role !== original.role;
    });

    from(updatedData)
      .pipe(
        concatMap((user) =>
          this.userService.apiUsersPut(user)),
        finalize(() => {
          this.router.navigate(['/dashboard']);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('Response:', response);
          }
        },
        error: (err) => console.error('Stream error:', err),
      });

  }
}