import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { StubUtilTests } from '../../ais/common/stub-util-tests';
import { SessionService } from '../../common/session.service';
import { AisConsentToGrant } from '../../ais/common/dto/ais-consent';
import { AuthConsentState } from '../../ais/common/dto/auth-state';
import { PaymentsConsentReviewComponent } from '../payments-consent-review/payments-consent-review.component';
import { ConsentPaymentAccessSelectionComponent } from './consent-payment-access-selection.component';
import { PisPayment } from '../common/models/pis-payment.model';
import { StubUtil } from '../../common/utils/stub-util';
import { PaymentUtil } from '../common/payment-util';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConsentPaymentAccessSelectionComponent', () => {
  let component: ConsentPaymentAccessSelectionComponent;
  let fixture: ComponentFixture<ConsentPaymentAccessSelectionComponent>;
  let sessionService;

  beforeAll(() => (window.onbeforeunload = jasmine.createSpy()));

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ConsentPaymentAccessSelectionComponent],
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
              getPaymentObject: () => new PisPayment(),
              getPaymentState: () => new AisConsentToGrant(),
              hasGeneralViolation: () => false,
              getConsentState: () => new AuthConsentState([]),
              getFintechName: (): string => StubUtil.FINTECH_NAME,
              setPaymentObject: () => new PisPayment(),
              getBankName: (): string => StubUtil.ASPSP_NAME
            }
          },
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsentPaymentAccessSelectionComponent);
    component = fixture.componentInstance;
    component.paymentReviewPage = PaymentsConsentReviewComponent.ROUTE;
    sessionService = TestBed.inject(SessionService);
    spyOn(component, 'hasGeneralViolations').and.returnValue(false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call onDeny', () => {
    const onDenySpy = spyOn(component, 'onDeny').and.callThrough();
    component.onDeny();
    expect(onDenySpy).toHaveBeenCalled();
  });

  it('should call onConfirm', () => {
    const paymentObj = PaymentUtil.getOrDefault(StubUtilTests.AUTH_ID, sessionService);
    const onConfirmSpy = spyOn(component, 'onConfirm').and.callThrough();
    spyOn(sessionService, 'setPaymentObject').withArgs(StubUtilTests.AUTH_ID, paymentObj);
    component.onConfirm();
    expect(onConfirmSpy).toHaveBeenCalled();
  });
});
