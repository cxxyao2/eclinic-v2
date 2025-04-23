import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _isDarkMode = signal(false);
  public readonly isDarkMode = this._isDarkMode.asReadonly();

  constructor() {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialDarkMode = savedTheme === 'dark' || 
      (savedTheme === null && prefersDark);
      
    this._isDarkMode.set(initialDarkMode);
    this.applyTheme();
  }

  public toggleTheme(): void {
    this._isDarkMode.update(dark => !dark);
    this.applyTheme();
  }

  private applyTheme(): void {
    const isDark = this._isDarkMode();
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}