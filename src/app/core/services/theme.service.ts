import { Injectable, PLATFORM_ID, inject,signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _isDarkMode = signal(false);
  public readonly isDarkMode = this._isDarkMode.asReadonly();
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize from localStorage or system preference
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const initialDarkMode = savedTheme === 'dark' || 
        (savedTheme === null && prefersDark);
        
      this._isDarkMode.set(initialDarkMode);
      this.applyTheme();
    }
  }

  public toggleTheme(): void {
    this._isDarkMode.update(dark => !dark);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const isDark = this._isDarkMode();
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
  }
}
