import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-patient-table',
  imports: [CommonModule, MatTableModule],
  templateUrl: './patient-table.component.html',
})
export class PatientTableComponent {

  displayedColumns: string[] = ['patientId', 'name', 'age', 'department', 'status'];
  patientData = [
    { patientId: 'P001', name: 'John Doe', age: 45, department: 'Emergency', status: 'Admitted' },
    { patientId: 'P002', name: 'Jane Smith', age: 32, department: 'ICU', status: 'Critical' },
    { patientId: 'P003', name: 'Mary Johnson', age: 65, department: 'Surgery', status: 'Discharged' },
  ];

}