import { ApplicationConfig, ErrorHandler, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BASE_PATH } from '@libs/api-client/variables';
import { GlobalErrorHandler } from '@core/services/global-error-handler.service';
import { authInterceptor } from '@core/interceptors/auth.interceptor';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { errorInterceptor } from '@core/interceptors/error-interceptor';

// Configuration objects
const zoneConfig = {
  eventCoalescing: true
};

const echartsConfig = {
  echarts: () => import('echarts')
};

const materialFormFieldConfig = {
  appearance: 'outline' as const,
  SubscriptSizing: 'dynamic'
};

const translocoConfig = {
  config: {
    availableLangs: ['en', 'fr', 'jp', 'cn'],
    defaultLang: 'en',
    reRenderOnLangChange: true,
    prodMode: !isDevMode(),
  },
  loader: TranslocoHttpLoader
};

// Environment configuration
const getBaseUrl = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const envWindow = window as any;
  return envWindow.__env?.BaseURL ?? '';
};

// Provider configurations
const routingProviders = [
  provideRouter(routes)
];

const httpProviders = [
  provideHttpClient(
    withInterceptors([
      authInterceptor,
      errorInterceptor
    ])
  )
];

const thirdPartyProviders = [
  {
    provide: NGX_ECHARTS_CONFIG,
    useValue: echartsConfig
  },
  {
    provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
    useValue: materialFormFieldConfig
  },
  provideTransloco(translocoConfig)
];

const environmentProviders = [
  {
    provide: BASE_PATH,
    useValue: getBaseUrl()
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(zoneConfig),
    ...routingProviders,
    ...httpProviders,
    ...thirdPartyProviders,
    ...environmentProviders,
    // Global error handler for uncaught exceptions
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ]
};
