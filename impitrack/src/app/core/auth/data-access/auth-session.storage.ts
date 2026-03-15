import { Injectable, inject } from '@angular/core';
import { BrowserStorageScope, BrowserStorageService } from '../../platform/browser-storage.service';
import { AuthSession } from '../models/auth-session.model';
import { AuthStorageMode } from '../models/auth-storage-mode.model';
import { CurrentUserDto } from '../models/current-user.model';

interface PersistedAuthState {
  readonly session: AuthSession;
  readonly user: CurrentUserDto | null;
}

interface AuthSessionSnapshot {
  readonly state: PersistedAuthState;
  readonly mode: AuthStorageMode;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionStorage {
  private readonly browserStorage = inject(BrowserStorageService);
  private readonly storageKey = 'impitrack.auth';

  read(): AuthSessionSnapshot | null {
    const localSnapshot = this.readFromScope('local');
    if (localSnapshot) {
      return localSnapshot;
    }

    return this.readFromScope('session');
  }

  write(state: PersistedAuthState, mode: AuthStorageMode): void {
    this.clear();
    this.browserStorage.setItem(this.storageKey, JSON.stringify(state), mode);
  }

  clear(): void {
    this.browserStorage.removeItem(this.storageKey, 'local');
    this.browserStorage.removeItem(this.storageKey, 'session');
  }

  private readFromScope(mode: BrowserStorageScope): AuthSessionSnapshot | null {
    const rawValue = this.browserStorage.getItem(this.storageKey, mode);

    if (!rawValue) {
      return null;
    }

    try {
      return {
        state: JSON.parse(rawValue) as PersistedAuthState,
        mode,
      };
    } catch {
      this.browserStorage.removeItem(this.storageKey, mode);
      return null;
    }
  }
}
