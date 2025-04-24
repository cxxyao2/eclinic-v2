import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GetVisitRecordDTO } from '@libs/api-client';

@Component({
  selector: 'app-check-in-waiting-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule
  ],
  templateUrl: './check-in-waiting-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckInWaitingListComponent implements AfterViewInit {
  // ViewChild
  @ViewChild(MatPaginator) private readonly paginator!: MatPaginator;
  // Input Properties
  @Input({ required: true })
  set waitingList(newList: GetVisitRecordDTO[]) {
    this.dataSource.data = newList;
  }

  // Public Properties
  public readonly displayedColumns: readonly string[] = [
    'visitId',
    'patientName',
    'practitionerName',
    'visitDate'
  ];

  public readonly dataSource = new MatTableDataSource<GetVisitRecordDTO>([]);

  public ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }
}
