import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type BrowserStorageScope = 'local' | 'session';

@Injectable({
  providedIn: 'root',
})
export class BrowserStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  getItem(key: string, scope: BrowserStorageScope = 'local'): string | null {
    return this.getStorage(scope)?.getItem(key) ?? null;
  }

  setItem(key: string, value: string, scope: BrowserStorageScope = 'local'): void {
    this.getStorage(scope)?.setItem(key, value);
  }

  removeItem(key: string, scope: BrowserStorageScope = 'local'): void {
    this.getStorage(scope)?.removeItem(key);
  }

  private getStorage(scope: BrowserStorageScope): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return scope === 'session' ? globalThis.sessionStorage : globalThis.localStorage;
  }
}
