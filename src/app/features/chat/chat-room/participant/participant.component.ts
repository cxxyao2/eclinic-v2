import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-participant',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class=" flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 sm:py-4 ">
      <div class="shrink-0">
        <img 
          [src]="avatarUrl" 
          [alt]="name" 
          class="mx-auto block h-16 w-16 rounded-full sm:mx-0 sm:shrink-0 object-cover"
          loading="lazy"
        >
      </div>
      <div class="space-y-2 text-center sm:text-left flex-grow">
        <div class="space-y-0.5">
          <p class="text-lg font-semibold text-black dark:text-white">{{name}}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .participant-elevation {
      box-shadow: var(--mat-sys-level1);
      margin-bottom: 1px; /* Add slight spacing between participants */
      background-color: var(--mat-sys-surface-container);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantComponent {
  @Input() name!: string;
  @Input() avatarUrl!: string;
}
