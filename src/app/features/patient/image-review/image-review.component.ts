import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { 
  ChangeDetectionStrategy, 
  Component, 
  EventEmitter, 
  inject, 
  Input, 
  OnChanges, 
  Output, 
  signal, 
  SimpleChanges 
} from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { BASE_PATH, ImageRecordsService } from '@libs/api-client';

@Component({
    selector: 'app-image-review',
    standalone: true,
    imports: [
      CommonModule, 
      MatProgressBarModule,
      MatIconModule
    ],
    templateUrl: './image-review.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageReviewComponent implements OnChanges {
  // Inputs/Outputs
  @Input() protected readonly fileName!: string;
  @Output() protected readonly close = new EventEmitter<void>();

  // Public signals
  protected readonly progress = signal<number>(0);
  protected readonly imageSrc = signal<string | null>(null);

  // Private injected services
  private readonly imageService = inject(ImageRecordsService);
  private readonly http = inject(HttpClient);
  private readonly basePath = inject(BASE_PATH);

  // Lifecycle hooks
  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileName']?.currentValue) {
      this.fetchImage();
    }
  }

  // Protected methods
  protected closePopup(): void {
    this.close.emit();
  }

  // Private methods
  private fetchImage(): void {
    this.progress.set(0);
    this.imageSrc.set(null);

    const options = {
      httpHeaderAccept: 'application/octet-stream',
      context: '',
      transferCache: true
    };

    this.downloadFile(this.fileName);
  }

  private downloadFile(fileName: string): void {
    const headers = new HttpHeaders({
      Accept: 'application/octet-stream'
    });

    this.http.get(`${this.basePath}/api/ImageRecords/images/${fileName}`, {
      headers,
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.DownloadProgress && event.total) {
          this.progress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          const blob = new Blob([event.body!], { type: 'image/jpeg' });
          this.imageSrc.set(URL.createObjectURL(blob));
          this.downloadBlob(fileName, blob);
        }
      },
      error: (error) => {
        console.error('Error downloading image:', error);
        this.progress.set(0);
        this.imageSrc.set(null);
      }
    });
  }

  private downloadBlob(filename: string, blob: Blob): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href); // Clean up the URL object
  }
}
