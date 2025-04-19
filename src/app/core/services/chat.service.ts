import { Injectable, inject, Inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ChatService as ApiChatService, ChatRoomDTOListServiceResponse } from '@libs/api-client';
import { ChatMessageDTO, ChatRoomDTO, CreateChatRoomDTO } from '@libs/api-client';
import { BASE_PATH } from '@libs/api-client/variables';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: HubConnection | null = null;
  private apiChatService = inject(ApiChatService);
  private baseUrl = inject(BASE_PATH);

  // Subjects for real-time updates
  private messagesSubject = new BehaviorSubject<ChatMessageDTO[]>([]);
  messages$ = this.messagesSubject.asObservable();

  async startConnection(): Promise<void> {
    try {
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${this.baseUrl}/chatHub`)
        .build();

      await this.hubConnection.start();
      console.log('SignalR Connected');

      this.hubConnection.on('ReceiveMessage', (message: ChatMessageDTO) => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message]);
      });
    } catch (err) {
      console.error('Error while starting SignalR connection: ', err);
    }
  }

  async joinRoom(roomId: number): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('JoinRoom', roomId);
    }
  }

  async leaveRoom(roomId: number): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('LeaveRoom', roomId);
    }
  }

  async sendMessage(roomId: number, message: string): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.invoke('SendMessage', roomId, message);
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

  getRoomMessages(roomId: number): Observable<ChatMessageDTO[]> {
    return this.apiChatService.apiChatRoomsRoomIdMessagesGet(roomId).pipe(
      map((response) => response.data ?? [])
    );
  }

  disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
