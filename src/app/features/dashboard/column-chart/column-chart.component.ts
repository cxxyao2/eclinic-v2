import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';

@Component({
    selector: 'app-column-chart',
    templateUrl: './column-chart.component.html',
    styleUrls: ['./column-chart.component.scss'],
    imports: [NgxEchartsDirective],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnChartComponent {
  options: EChartsOption = {
    tooltip: {},
    legend: {
      data: ['Admitted', 'Discharged']
    },
    xAxis: {
      data: ['Jan', 'Feb', 'Mar', 'April', 'May', 'June']
    },
    yAxis: {},
    series: [
      {
        name: 'Admitted',
        type: 'bar',
        data: [120, 90, 100, 110, 120, 50]
      },
      {
        name: 'Discharged',
        type: 'bar',
        data: [80, 70, 90, 100, 110, 40]
      }
    ]
  };

}
