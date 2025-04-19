import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UserProfile } from '@shared/models/userProfile.model';


@Component({
  selector: 'app-profile',
  imports: [MatIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent {
  imagePath = input<string>('assets/images/sarah.jpg');
  profileInfo = input.required<UserProfile>();
}
