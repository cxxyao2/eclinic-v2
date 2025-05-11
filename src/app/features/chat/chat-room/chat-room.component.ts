import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { SignalRChatService } from '@core/services/signalr-chat.service';
import { ChatMessageDTO } from '@libs/api-client';
import { MessageComposerComponent } from './message-composer/message-composer.component';
import { ParticipantComponent } from './participant/participant.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MessageComposerComponent,
    ParticipantComponent
  ],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ChatRoomComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly chatService = inject(SignalRChatService);
  private readonly destroyRef = inject(DestroyRef);

  protected showMessageComposer = signal(false);


  protected readonly roomId = signal<number>(0);
  protected messages = signal<ChatMessageDTO[]>([]);
  protected messageControl = new FormControl('', { nonNullable: true });
  protected currentUserId = 1; // TODO: Get from auth service

  // todo. should use resource + signal to get participants
  protected participants = [
    {
      userId: 1,
      name: 'Dr. Smith',
      avatarUrl: 'assets/avatars/doctor.jpg'
    },
    {
      userId: 2,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 3,
      name: 'Dr. Smith',
      avatarUrl: 'assets/avatars/doctor.jpg'
    },
    {
      userId: 4,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 5,
      name: 'Dr. Smith',
      avatarUrl: 'assets/avatars/doctor.jpg'
    },
    {
      userId: 6,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 7,
      name: 'Dr. Smith',
      avatarUrl: 'assets/avatars/doctor.jpg'
    },
    {
      userId: 8,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 9,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 10,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    },
    {
      userId: 11,
      name: 'John Doe',
      avatarUrl: 'assets/avatars/patient.jpg'
    }
  ];

  protected readonly errorMessage = signal<string>('');

  constructor() {
    this.route.paramMap.pipe(
      map(params => Number(params.get('roomId'))),
      takeUntilDestroyed()
    ).subscribe(id => this.roomId.set(id));

    this.initializeRoom();

    // Subscribe to chat service messages
    this.chatService.messages$
      .pipe(takeUntilDestroyed())
      .subscribe(messages => this.messages.set(messages));

    // Subscribe to chat service errors
    this.chatService.errors$
      .pipe(takeUntilDestroyed())
      .subscribe(error => this.errorMessage.set(error));


  }

  private async initializeRoom(): Promise<void> {
    await this.chatService.startConnection();
    await this.chatService.joinRoom(this.roomId());
    await this.chatService.getRoomMessages(this.roomId());
  }

  protected toggleMessageComposer(): void {
    this.showMessageComposer.update(value => !value);
  }

  protected onMessageSent(message: string): void {
    this.chatService.sendMessage(this.roomId(), message);

  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.roomId());
    this.chatService.disconnect();
  }
}





