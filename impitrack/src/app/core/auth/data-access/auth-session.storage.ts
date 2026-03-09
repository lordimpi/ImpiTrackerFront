import { Injectable, inject } from '@angular/core';
import { BrowserStorageService } from '../../platform/browser-storage.service';
import { AuthSession } from '../models/auth-session.model';
import { CurrentUserDto } from '../models/current-user.model';

interface PersistedAuthState {
  readonly session: AuthSession;
  readonly user: CurrentUserDto | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionStorage {
  private readonly browserStorage = inject(BrowserStorageService);
  private readonly storageKey = 'impitrack.auth';

  read(): PersistedAuthState | null {
    const rawValue = this.browserStorage.getItem(this.storageKey);

    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as PersistedAuthState;
    } catch {
      this.clear();
      return null;
    }
  }

  write(state: PersistedAuthState): void {
    this.browserStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  clear(): void {
    this.browserStorage.removeItem(this.storageKey);
  }
}
