import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthorizationComponent } from './authorization/authorization.component';
import { UserLogHistoryComponent } from './user-log-history/user-log-history.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    AuthorizationComponent,
    UserLogHistoryComponent
  ],
  templateUrl: './admin.component.html'
})
export class AdminComponent {
  protected readonly tabs = [
    { label: 'User Authorization', component: 'authorization' },
    { label: 'User Log History', component: 'log-history' }
  ];
}