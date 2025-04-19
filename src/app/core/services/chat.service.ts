import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';
import { Injectable, Inject, Optional } from '@angular/core';
import { map, Subject } from 'rxjs';
import { BASE_PATH } from '@libs/api-client/variables';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: HubConnection | undefined;
  private errorSubject = new Subject<string>();
  apiChatService

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
    } catch (err) {
      console.error('Error while starting connection: ', err);
      throw err;
    }
  };

  private ensureConnection(): asserts this is { hubConnection: HubConnection } {
    if (!this.hubConnection) {
      throw new Error('No connection available');
    }
  }

  async joinRoom(roomId: number): Promise<void> {
    this.ensureConnection();
    if(this.hubConnection) {
      try {
        await this.hubConnection.invoke('JoinRoom', roomId);
      } catch (err) {
        const errorMessage = 'Failed to join room: ' + (err instanceof Error ? err.message : String(err));
        this.errorSubject.next(errorMessage);
        throw err;
      }

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

  getRoomMessages(roomId: number): Observable<ChatMessageDTO[]> {
    return this.apiChatService.apiChatRoomsRoomIdMessagesGet(roomId).pipe(
      map((response) => response.data ?? [])
    );
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
