import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private readonly _isOpen = signal(false);
  public readonly isOpen = this._isOpen.asReadonly();

  public toggle(): void {
    this._isOpen.update(state => !state);
  }

  public close(): void {
    this._isOpen.set(false);
  }
}
