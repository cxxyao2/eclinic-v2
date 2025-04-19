import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal, Signal } from '@angular/core';
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

import { ChatService } from '@services/chat.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatRoomComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly roomId = signal<number>(0);

  private chatService = inject(ChatService);
  private destroyRef = inject(DestroyRef);

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
    }
  ];

  constructor() {
    this.route.paramMap.pipe(
      map(params => Number(params.get('roomId'))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => this.roomId.set(id));

    this.chatService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(messages => this.messages.set(messages));

    this.initializeRoom();
  }

  private async initializeRoom(): Promise<void> {
    await this.chatService.startConnection();
    await this.chatService.joinRoom(this.roomId());

    this.chatService.getRoomMessages(this.roomId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(messages => this.messages.set(messages));
  }

  protected onMessageSent(message: string): void {
    this.chatService.sendMessage(this.roomId(), message);
  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.roomId());
    this.chatService.disconnect();
  }
}





