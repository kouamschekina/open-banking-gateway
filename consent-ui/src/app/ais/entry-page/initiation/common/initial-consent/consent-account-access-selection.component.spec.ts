import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SessionService } from '../../../../../common/session.service';
import { AccountAccessLevel, AisConsentToGrant } from '../../../../common/dto/ais-consent';
import { AuthConsentState } from '../../../../common/dto/auth-state';
import { Access, ConsentAccountAccessSelectionComponent } from './consent-account-access-selection.component';
import { AccountsConsentReviewComponent } from '../../accounts/accounts-consent-review/accounts-consent-review.component';
import { DedicatedAccessComponent } from '../dedicated-access/dedicated-access.component';
import { StubUtilTests } from '../../../../common/stub-util-tests';
import { UpdateConsentAuthorizationService } from '../../../../../api';
import { StubUtil } from '../../../../../common/utils/stub-util';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConsentAccountAccessSelectionComponent', () => {
  let component: ConsentAccountAccessSelectionComponent;
  let fixture: ComponentFixture<ConsentAccountAccessSelectionComponent>;
  let updateConsentAuthorizationService: UpdateConsentAuthorizationService;

  beforeAll(() => (window.onbeforeunload = jasmine.createSpy()));

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ConsentAccountAccessSelectionComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        imports: [ReactiveFormsModule, RouterTestingModule],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              parent: { parent: { params: of({ authId: StubUtilTests.AUTH_ID }) } },
              snapshot: {}
            }
          },
          {
            provide: SessionService,
            useValue: {
              getConsentObject: () => new AisConsentToGrant(),
              getConsentState: () => new AuthConsentState([]),
              getFintechName: (): string => StubUtil.FINTECH_NAME,
              getBankName: (): string => StubUtil.ASPSP_NAME,
              getConsentTypesSupported: () => []
            }
          },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentAccountAccessSelectionComponent);
    component = fixture.componentInstance;
    component.consentReviewPage = AccountsConsentReviewComponent.ROUTE;
    component.dedicatedConsentPage = DedicatedAccessComponent.ROUTE;
    component.accountAccesses = [new Access(AccountAccessLevel.ALL_ACCOUNTS, 'access to all accounts')];
    updateConsentAuthorizationService = TestBed.inject(UpdateConsentAuthorizationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onConfirm', () => {
    const onConfirmSpy = spyOn(component, 'onConfirm');
    component.onConfirm();
    expect(onConfirmSpy).toHaveBeenCalled();
  });

  it('should call denyUsingPOST', () => {
    const consentAuthorizationServiceSpy = spyOn(updateConsentAuthorizationService, 'denyUsingPOST').and.returnValue(
      of()
    );
    component.onDeny();
    expect(consentAuthorizationServiceSpy).toHaveBeenCalled();
  });

  it('should check hasInputs', () => {
    const hasInputsSpy = spyOn(component, 'hasInputs');
    component.hasInputs();
    expect(hasInputsSpy).toHaveBeenCalled();
  });

  it('should check hasAisViolations', () => {
    const hasAisViolationsSpy = spyOn(component, 'hasAisViolations');
    component.hasAisViolations();
    expect(hasAisViolationsSpy).toHaveBeenCalled();
  });

  it('should check hasGeneralViolations', () => {
    const hasGeneralViolationsSpy = spyOn(component, 'hasGeneralViolations');
    component.hasGeneralViolations();
    expect(hasGeneralViolationsSpy).toHaveBeenCalled();
  });

  it('should call handleMethodSelectedEvent', () => {
    const handleMethodSelectedEventSpy = spyOn(component, 'handleMethodSelectedEvent');
    const access: Access = {
      id: AccountAccessLevel.ALL_ACCOUNTS,
      message: 'yes we can'
    };
    component.handleMethodSelectedEvent(access);
    expect(handleMethodSelectedEventSpy).toHaveBeenCalled();
  });

  it('should check submitButtonMessage', () => {
    const submitButtonMessageSpy = spyOn(component, 'submitButtonMessage');
    component.submitButtonMessage();
    expect(submitButtonMessageSpy).toHaveBeenCalled();
  });
});
