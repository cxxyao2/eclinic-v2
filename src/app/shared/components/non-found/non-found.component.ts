import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-non-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './non-found.component.html',
  styleUrls: ['./non-found.component.scss']
})
export class NonFoundComponent {
  // Add any methods you might need here
  goBack(): void {
    window.history.back();
  }
}
