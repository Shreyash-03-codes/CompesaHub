import { APP_INITIALIZER, ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';

function initializeAuth(): () => Promise<void> {
  return () => inject(AuthService).init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
  ],
};
