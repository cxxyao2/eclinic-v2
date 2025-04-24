import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsDirective } from 'ngx-echarts';

@Component({
    selector: 'app-line-chart',
    templateUrl: './line-chart.component.html',
    imports: [NgxEchartsDirective],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent implements OnInit {

  chartOption!: EChartsOption;

  ngOnInit(): void {
    this.initializeChartOptions();
  }


  initializeChartOptions(): void {
    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line'
        }
      },
      legend: {
        data: ['Respiratory Infections', 'Cardiac Cases']
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [
        {
          name: 'Respiratory Infections',
          type: 'line',
          data: [120, 150, 180, 220, 260, 300],
          smooth: true,
          lineStyle: {
            color: '#FF6F61'
          },
          areaStyle: {
            color: 'rgba(255, 111, 97, 0.3)'
          }
        },
        {
          name: 'Cardiac Cases',
          type: 'line',
          data: [80, 100, 120, 140, 160, 180],
          smooth: true,
          lineStyle: {
            color: '#3BAFDA'
          },
          areaStyle: {
            color: 'rgba(59, 175, 218, 0.3)'
          }
        }
      ]
    };


  }


}



