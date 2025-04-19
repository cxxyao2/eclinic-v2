import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptors } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { provideTransloco } from '@jsverse/transloco';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { BASE_PATH } from '@libs/api-client/variables';

import { routes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-loader';
import { authInterceptor } from '@core/interceptors/auth.interceptor';

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
  const envWindow = window as any;
  return envWindow.__env?.BaseURL || '';
};

// Provider configurations
const routingProviders = [
  provideRouter(routes)
];

const httpProviders = [
  provideHttpClient(
    withInterceptors([
      authInterceptor
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
    ...environmentProviders
  ]
};
