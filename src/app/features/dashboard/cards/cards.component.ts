import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-cards',
    imports: [CommonModule, MatGridListModule, MatIconModule, MatCardModule],
    templateUrl: './cards.component.html',
})
export class CardsComponent {
  cards = [
    { title: 'Total Patients Today', value: 42, icon:'personal_injury' },
    { title: 'Available Beds', value: 12, icon:'bed' },
    { title: 'Critical Cases', value: 5, icon:'emergency' },
    { title: 'Staff on Duty', value: 28, icon:'medical_services' },
  ];
}
