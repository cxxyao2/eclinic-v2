import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserProfile } from '@shared/models/index';


@Component({
  selector: 'app-profile',
  imports: [
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  imagePath = input<string>('assets/images/sarah.jpg');
  profileInfo = input.required<Partial<UserProfile>>();
}
