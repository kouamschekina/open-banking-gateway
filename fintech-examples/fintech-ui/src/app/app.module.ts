import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { environment } from '../environments/environment';
import { ApiModule, Configuration, ConfigurationParameters } from './api';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './common/shared.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LoginComponent } from './login/login.component';
import { GlobalErrorHandler } from './errorsHandler/global-errors-handler';
import { ErrorService } from './errorsHandler/error.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RedirectAfterConsentComponent } from './redirect-after-consent/redirect-after-consent.component';
import { NavbarComponent } from './common/navbar/navbar.component';
import { DocumentCookieService } from './services/document-cookie.service';
import { RedirectAfterConsentDeniedComponent } from './redirect-after-consent-denied/redirect-after-consent-denied.component';
import { SessionExpiredComponent } from './session-expired/session-expired.component';
import { SimpleTimer } from 'src/app/services/simple-timer';
import { RedirectAfterPaymentComponent } from './redirect-after-payment/redirect-after-payment.component';
import { RedirectAfterPaymentDeniedComponent } from './redirect-after-payment-denied/redirect-after-payment-denied.component';
import { Oauth2LoginComponent } from './oauth2-login/oauth2-login.component';
import { ForbiddenOauth2Component } from './invalid-oauth2/forbidden-oauth2.component';
import { TimerService } from './services/timer.service';
import { NgHttpLoaderComponent } from 'ng-http-loader';

export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.FINTECH_API,
    withCredentials: true
  };

  return new Configuration(params);
}

@NgModule({ declarations: [
        AppComponent,
        LoginComponent,
        Oauth2LoginComponent,
        ForbiddenOauth2Component,
        RedirectAfterConsentComponent,
        RedirectAfterPaymentComponent,
        NavbarComponent,
        RedirectAfterConsentDeniedComponent,
        RedirectAfterPaymentDeniedComponent,
        SessionExpiredComponent
    ],
    bootstrap: [AppComponent], imports: [AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    SharedModule,
    ApiModule.forRoot(apiConfigFactory), NgHttpLoaderComponent], providers: [
        SimpleTimer,
        AuthGuard,
        ErrorService,
        DocumentCookieService,
        TimerService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        provideHttpClient(withInterceptorsFromDi(), withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN'
        }))
    ] })
export class AppModule {}
