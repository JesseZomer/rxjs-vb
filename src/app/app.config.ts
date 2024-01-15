import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { registerLocaleData } from '@angular/common';
import localeNl from '@angular/common/locales/nl';
import { setDefaultOptions } from 'date-fns';
import { nl } from 'date-fns/locale';
import { routes } from './app.routes';

registerLocaleData(localeNl);
setDefaultOptions({ locale: nl });

export const appConfig: ApplicationConfig = {
    providers: [provideRouter(routes), { provide: LOCALE_ID, useValue: 'nl-NL' }]
};
