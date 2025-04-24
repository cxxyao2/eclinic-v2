import { Component } from '@angular/core';
import { ColumnChartComponent } from "../column-chart/column-chart.component";
import { LineChartComponent } from "../line-chart/line-chart.component";
import { PatientTableComponent } from "../patient-table/patient-table.component";
import { CardsComponent } from "../cards/cards.component";

@Component({
  selector: 'app-dashboard-container',
  imports: [ColumnChartComponent, LineChartComponent, PatientTableComponent, CardsComponent],
  templateUrl: './dashboard-container.component.html',
})
export class DashboardContainerComponent {

}
