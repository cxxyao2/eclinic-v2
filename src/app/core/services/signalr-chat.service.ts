import { Injectable, Inject, Optional, inject, DestroyRef } from '@angular/core';
import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { Observable, Subject, BehaviorSubject, map } from 'rxjs';
import { BASE_PATH } from '@libs/api-client/variables';
import { ChatMessageDTO, ChatRoomDTO, ChatRoomDTOListServiceResponse, ChatService, CreateChatRoomDTO } from '@libs/api-client';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class SignalRChatService {
  public hubConnection: HubConnection | undefined;
  private errorSubject = new Subject<string>();
  private messagesSubject = new BehaviorSubject<ChatMessageDTO[]>([]);
  private apiChatService = inject(ChatService);

  public errors$ = this.errorSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  private destroyRef = inject(DestroyRef);

  constructor(@Optional() @Inject(BASE_PATH) private basePath: string) {
    this.basePath = basePath || '';
  }

  public startConnection = async () => {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.basePath}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.hubConnection.start();
      console.log('Connection started');
      
      // Set up message receiver
      this.hubConnection.on('ReceiveMessage', (message: ChatMessageDTO) => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([message, ...currentMessages]);
      });

    } catch (err) {
      const errorMessage = 'Error while starting connection: ' + (err instanceof Error ? err.message : String(err));
      this.errorSubject.next(errorMessage);
      throw err;
    }
  };

  private ensureConnection(): asserts this is { hubConnection: HubConnection } {
    if (!this.hubConnection) {
      const errorMessage = 'No connection available';
      this.errorSubject.next(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async joinRoom(roomId: number): Promise<void> {
    this.ensureConnection();
    try {
      await this.hubConnection.invoke('JoinRoom', roomId);
    } catch (err) {
      const errorMessage = 'Failed to join room: ' + (err instanceof Error ? err.message : String(err));
      this.errorSubject.next(errorMessage);
      throw err;
    }
  }

  async leaveRoom(roomId: number): Promise<void> {
    this.ensureConnection();
    try {
      await this.hubConnection.invoke('LeaveRoom', roomId);
    } catch (err) {
      const errorMessage = 'Failed to leave room: ' + (err instanceof Error ? err.message : String(err));
      this.errorSubject.next(errorMessage);
      throw err;
    }
  }

  async sendMessage(roomId: number, message: string): Promise<void> {
    this.ensureConnection();
    try {
      await this.hubConnection.invoke('SendMessage', roomId, message);
    } catch (err) {
      const errorMessage = 'Failed to send message: ' + (err instanceof Error ? err.message : String(err));
      this.errorSubject.next(errorMessage);
      throw err;
    }
  }

  // REST API methods
  getChatRooms(): Observable<ChatRoomDTO[]> {
    return this.apiChatService.apiChatRoomsGet().pipe(
      map((response: ChatRoomDTOListServiceResponse) => response.data ?? [])
    );
  }

  createChatRoom(request: CreateChatRoomDTO): Observable<ChatRoomDTO> {
    return this.apiChatService.apiChatRoomsPost(request).pipe(
      map((response) => response.data!)
    );
  }

  async getRoomMessages(roomId: number): Promise<void> {
    try {
      this.apiChatService.apiChatRoomsRoomIdMessagesGet(roomId).pipe(
        map(response => response?.data ?? []),
        map(messages => messages.reverse()),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (messages) => this.messagesSubject.next(messages),
        error: (err) => {
          const errorMessage = 'Failed to fetch messages: ' + (err instanceof Error ? err.message : String(err));
          this.errorSubject.next(errorMessage);
          throw err;
        }
      });
    } catch (err) {
      const errorMessage = 'Failed to fetch messages: ' + (err instanceof Error ? err.message : String(err));
      this.errorSubject.next(errorMessage);
      throw err;
    }
  }

  disconnect(): void {
    if (this.hubConnection) {
      try {
        this.hubConnection.stop();
      } catch (err) {
        const errorMessage = 'Error disconnecting: ' + (err instanceof Error ? err.message : String(err));
        this.errorSubject.next(errorMessage);
      }
    }
  }
}
