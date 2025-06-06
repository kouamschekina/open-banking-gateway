import {AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';

import {UpdateConsentAuthorizationService} from '../../api';
import {ApiHeaders} from '../../api/api.headers';
import {SessionService} from '../../common/session.service';
import {AuthConsentState} from '../../ais/common/dto/auth-state';
import {StubUtil} from '../../common/utils/stub-util';
import {PaymentUtil} from '../common/payment-util';
import {PisPayment} from '../common/models/pis-payment.model';

@Component({
    selector: 'consent-app-payment-access-selection',
    templateUrl: './consent-payment-access-selection.component.html',
    styleUrls: ['./consent-payment-access-selection.component.scss'],
    standalone: false
})
export class ConsentPaymentAccessSelectionComponent implements OnInit, AfterContentChecked {
  public finTechName: string;
  public aspspName: string;

  @Input() paymentReviewPage: string;

  public paymentAccessForm: UntypedFormGroup;
  public state: AuthConsentState;
  public payment: PisPayment;

  private authorizationId: string;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private sessionService: SessionService,
    private updateConsentAuthorizationService: UpdateConsentAuthorizationService,
    private cdRef: ChangeDetectorRef
  ) {
    this.paymentAccessForm = this.formBuilder.group({});
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  ngOnInit() {
    this.activatedRoute.parent.parent.params.subscribe((res) => {
      this.authorizationId = res.authId;
      this.aspspName = this.sessionService.getBankName(res.authId);
      this.finTechName = this.sessionService.getFintechName(res.authId);
      this.state = this.sessionService.getPaymentState(this.authorizationId, () => new AuthConsentState());
      if (!this.hasGeneralViolations()) {
        this.moveToReviewPayment();
      }

      this.payment = PaymentUtil.getOrDefault(this.authorizationId, this.sessionService);
    });
  }

  hasGeneralViolations(): boolean {
    return this.state.hasGeneralViolation();
  }

  onConfirm() {
    this.updatePaymentObject();
    this.moveToReviewPayment();
  }

  onDeny() {
    this.updateConsentAuthorizationService
      .denyUsingPOST(
        this.authorizationId,
        StubUtil.X_REQUEST_ID, // TODO: real values instead of stubs
        'response'
      )
      .subscribe((res) => {
        window.location.href = res.headers.get(ApiHeaders.LOCATION);
      });
  }

  private updatePaymentObject() {
    const paymentObj = PaymentUtil.getOrDefault(this.authorizationId, this.sessionService);

    if (this.hasGeneralViolations()) {
      paymentObj.extras = paymentObj.extras ? paymentObj.extras : {};
      this.state
        .getGeneralViolations()
        .forEach((it) => (paymentObj.extras[it.code] = this.paymentAccessForm.get(it.code).value));
    }

    this.sessionService.setPaymentObject(this.authorizationId, paymentObj);
  }

  private moveToReviewPayment() {
    this.router.navigate([this.paymentReviewPage], { relativeTo: this.activatedRoute });
  }
}
