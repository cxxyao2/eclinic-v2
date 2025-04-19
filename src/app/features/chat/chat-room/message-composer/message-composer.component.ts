import { 
  ChangeDetectionStrategy, 
  Component, 
  ElementRef, 
  EventEmitter, 
  Output, 
  ViewChild, 
  input 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './message-composer.component.html',
  styleUrls: ['./message-composer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComposerComponent {
  roomId = input.required<number>();
  @Output() messageSent = new EventEmitter<string>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  protected messageControl = new FormControl('', { nonNullable: true });


  protected sendMessage(): void {
    const message = this.messageControl.value.trim();
    if (message) {
      this.messageSent.emit(message);
      this.messageControl.reset();
      // Reset textarea height
      this.messageInput.nativeElement.style.height = 'auto';
    }
  }

  protected autoResizeTextarea(): void {
    const textarea = this.messageInput.nativeElement;
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set new height based on scrollHeight
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }
}
