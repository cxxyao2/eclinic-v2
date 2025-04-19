import {
  ChangeDetectionStrategy,
  Component,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ChatRoomDTO } from '@libs/api-client';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-chat-room-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    TimeAgoPipe
  ],
  templateUrl: './chat-room-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatRoomCardComponent {
  // Input properties
  public readonly room = input.required<ChatRoomDTO>();

  // Protected constants
  protected readonly placeholderImage = 'https://placehold.co/600x400/e9ecef/495057?text=Chat+Room';
  protected readonly participantsCount = 2; // TODO: Get from room data
  protected readonly messagesCount = 15; // TODO: Get from room data
}


