import {
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Component,
  inject,
  AfterViewInit,
  OnDestroy,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignatureDTO, SignaturesService, StringServiceResponse } from '@libs/api-client';
import { MatButtonModule } from '@angular/material/button';
import { DialogSimpleDialog } from '../../../shared/components/dialog/dialog-simple-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SnackbarService } from '@services/snackbar-service.service';
import { ConsultationService } from '../services/consultation.service';
import { HttpErrorResponse } from '@angular/common/http';
import {  takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-consulation-signature',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './consulation-signature.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsulationSignatureComponent implements AfterViewInit, OnDestroy {
  // ViewChild
  @ViewChild('canvasElement', { static: true })
  private readonly canvasElement!: ElementRef<HTMLCanvasElement>;

  // Injected services
  private readonly signService = inject(SignaturesService);
  private readonly snackbarService = inject(SnackbarService);
  private readonly consultationService = inject(ConsultationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // Private properties
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;

  // Lifecycle hooks
  public ngAfterViewInit(): void {
    this.initializeCanvas();
    this.subscribeToVisitChanges();
  }

  public ngOnDestroy(): void {
    // No need to manually unsubscribe thanks to takeUntilDestroyed
  }

  // Private methods
  private subscribeToVisitChanges(): void {
    this.consultationService.currentVisit
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visit => {
        if (visit === null) {
          this.clearCanvas();
        }
      });
  }

  private initializeCanvas(): void {
    this.canvas = this.canvasElement.nativeElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.setupCanvasContext();
  }

  private setupCanvasContext(): void {
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';
  }

  private getPosition(event: MouseEvent | TouchEvent): { x: number, y: number } {
    const rect = this.canvas.getBoundingClientRect();
    if (event instanceof MouseEvent) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    } else {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
  }

  private isCanvasBlank(): boolean {
    const pixelBuffer = new Uint32Array(
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data.buffer
    );
    return !pixelBuffer.some(color => color !== 0);
  }

  // Public methods
  public startDrawing(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    this.ctx.beginPath();
    const { x, y } = this.getPosition(event);
    this.ctx.moveTo(x, y);
  }

  public draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    const { x, y } = this.getPosition(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  public stopDrawing(): void {
    this.isDrawing = false;
    this.ctx.closePath();
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public submitSignature(): void {
    if (this.isCanvasBlank()) {
      this.showBlankCanvasDialog();
      return;
    }
    this.saveSignature();
  }

  private showBlankCanvasDialog(): void {
    this.dialog.open(DialogSimpleDialog, {
      data: {
        title: 'Notification',
        content: 'Please sign your name on the touchpad before saving the prescription.',
        isCancelButtonVisible: false
      },
    });
  }

  private saveSignature(): void {
    const dataUrl = this.canvas.toDataURL('image/png');
    const visitId = this.consultationService.currentVisit.value?.visitId;
    const signDTO: SignatureDTO = {
      image: dataUrl,
      visitRecordId: visitId ?? 0
    };

    this.signService.apiSignaturesPost(signDTO)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res: StringServiceResponse) => {
        this.consultationService.setSignaturePath(res.data ?? '');
        this.snackbarService.show('Signature uploaded successfully');
      },
      error: (err: HttpErrorResponse) => {
        this.snackbarService.show('Failed to upload signature', 'error-snackbar');
        console.error('Failed to upload signature', err);
      }

    });
  }
}
