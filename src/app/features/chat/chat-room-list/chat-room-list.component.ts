import { 
  ChangeDetectionStrategy, 
  Component, 
  inject 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';

import { ChatService } from '@services/chat.service';
import { ChatRoomDTO } from '@libs/api-client';
import { ChatRoomCardComponent } from './chat-room-card/chat-room-card.component';

@Component({
  selector: 'app-chat-room-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule,
    ChatRoomCardComponent
  ],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <!-- Header with Create Button -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Chat Rooms
        </h1>
        
        <button 
          mat-raised-button 
          [routerLink]="['/chatroom-create']"
          class="bg-[var(--mat-app-primary)] text-[var(--mat-app-on-primary)]
                 hover:opacity-90 transition-opacity duration-200
                 px-4 py-2 rounded-lg shadow-sm"
        >
          Create New Room
        </button>
      </div>

      <!-- Chat Rooms Grid -->
      <div class="flex-1 overflow-auto min-h-0
                  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
                  gap-4 auto-rows-max">
        @for (room of rooms(); track room.chatRoomId) {
          <app-chat-room-card [room]="room" />
        }
        @empty {
          <div class="col-span-full flex flex-col items-center justify-center
                      p-8 text-gray-500 dark:text-gray-400">
            <p class="text-lg mb-2">No chat rooms available</p>
            <p class="text-sm">Create a new room to get started</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatRoomListComponent {
  // Dependencies
  private readonly chatService = inject(ChatService);

  // Public signals
  protected readonly rooms = toSignal(this.chatService.getChatRooms(), {
    initialValue: [] as ChatRoomDTO[]
  });
}


