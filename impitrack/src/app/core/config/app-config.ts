import { InjectionToken } from '@angular/core';

export interface AppConfig {
  readonly apiBaseUrl: string;
  readonly appName: string;
  readonly production: boolean;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
