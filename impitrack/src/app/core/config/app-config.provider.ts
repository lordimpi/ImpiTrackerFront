import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { APP_CONFIG } from './app-config';
import { environment } from '../../../environments/environment';

export function provideAppConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: APP_CONFIG,
      useValue: {
        apiBaseUrl: environment.apiBaseUrl,
        appName: environment.appName,
        production: environment.production,
      },
    },
  ]);
}
