import { AfterContentChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthConsentState } from '../../../../common/dto/auth-state';
import { SessionService } from '../../../../../common/session.service';
import { StubUtil } from '../../../../../common/utils/stub-util';
import {
  AccountAccessLevel,
  AccountAccessLevelAspspConsentSupport,
  AisConsentToGrant
} from '../../../../common/dto/ais-consent';
import { ConsentUtil } from '../../../../common/consent-util';
import { ConsentAuth, UpdateConsentAuthorizationService } from '../../../../../api';
import { ApiHeaders } from '../../../../../api/api.headers';

@Component({
    selector: 'consent-app-access-selection',
    templateUrl: './consent-account-access-selection.component.html',
    styleUrls: ['./consent-account-access-selection.component.scss'],
    standalone: false
})
export class ConsentAccountAccessSelectionComponent implements OnInit, AfterContentChecked {
  public finTechName: string;
  public aspspName: string;

  @Input() accountAccesses: Access[];
  @Input() consentReviewPage: string;
  @Input() dedicatedConsentPage: string;

  public filteredAccountAccesses: Access[];
  public selectedAccess;
  public accountAccessForm: UntypedFormGroup;
  public state: AuthConsentState;
  public consent: AisConsentToGrant;

  private authorizationId: string;

  private static hasIntersection(
    source: Set<ConsentAuth.SupportedConsentTypesEnum>,
    target: Set<ConsentAuth.SupportedConsentTypesEnum>
  ): boolean {
    for (const entry of source) {
      if (target.has(entry)) {
        return true;
      }
    }

    return false;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private sessionService: SessionService,
    private updateConsentAuthorizationService: UpdateConsentAuthorizationService,
    private cdRef: ChangeDetectorRef
  ) {
    this.accountAccessForm = this.formBuilder.group({});
  }

  ngAfterContentChecked(): void {
    this.cdRef.detectChanges();
  }

  ngOnInit() {
    this.activatedRoute.parent.parent.params.subscribe((res) => {
      this.authorizationId = res.authId;
      this.aspspName = this.sessionService.getBankName(res.authId);
      this.finTechName = this.sessionService.getFintechName(res.authId);
      this.state = this.sessionService.getConsentState(this.authorizationId, () => new AuthConsentState());
      if (!this.hasInputs()) {
        this.moveToReviewConsent();
      }

      this.selectedAccess = new UntypedFormControl(this.accountAccesses[0], Validators.required);
      this.accountAccessForm.addControl('accountAccess', this.selectedAccess);
      this.consent = ConsentUtil.getOrDefault(this.authorizationId, this.sessionService);
      const bankSupportFromApi = this.sessionService.getConsentTypesSupported(res.authId);
      if (bankSupportFromApi) {
        const bankSupport = new Set(this.sessionService.getConsentTypesSupported(res.authId) || []);
        this.filteredAccountAccesses = this.accountAccesses.filter((it) =>
          ConsentAccountAccessSelectionComponent.hasIntersection(
            AccountAccessLevelAspspConsentSupport.get(it.id),
            bankSupport
          )
        );
      } else {
        this.filteredAccountAccesses = this.accountAccesses;
      }
    });
    if (this.filteredAccountAccesses && this.filteredAccountAccesses.length === 1) {
      this.selectedAccess.setValue(this.filteredAccountAccesses[0]);
    }
  }

  hasInputs(): boolean {
    return this.hasAisViolations() || this.hasGeneralViolations();
  }

  hasAisViolations(): boolean {
    return this.state.hasAisViolation();
  }

  hasGeneralViolations(): boolean {
    return this.state.hasGeneralViolation();
  }

  handleMethodSelectedEvent(access: Access) {
    this.selectedAccess.setValue(access);
    console.log(this.selectedAccess);
  }

  submitButtonMessage() {
    return this.selectedAccess.value.id === AccountAccessLevel.FINE_GRAINED ? 'Specify access' : 'Grant access';
  }

  onConfirm() {
    this.updateConsentObject();

    if (this.selectedAccess.value.id === AccountAccessLevel.FINE_GRAINED) {
      this.handleDedicatedAccess();
      return;
    }

    this.handleGenericAccess();
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

  private updateConsentObject() {
    const consentObj = ConsentUtil.getOrDefault(this.authorizationId, this.sessionService);

    if (this.state.hasGeneralViolation()) {
      consentObj.extras = consentObj.extras ? consentObj.extras : {};
      this.state
        .getGeneralViolations()
        .forEach((it) => (consentObj.extras[it.code] = this.accountAccessForm.get(it.code).value));
    }

    consentObj.level = this.selectedAccess.value.id;

    if (this.selectedAccess.value.id !== AccountAccessLevel.FINE_GRAINED) {
      if (this.selectedAccess.value.id === AccountAccessLevel.ALL_PSD2) {
        consentObj.consent.access.allPsd2 = AccountAccessLevel.ALL_ACCOUNTS;
      } else {
        consentObj.consent.access.availableAccounts = this.selectedAccess.value.id;
      }
    }

    this.sessionService.setConsentObject(this.authorizationId, consentObj);
  }

  private handleGenericAccess() {
    this.moveToReviewConsent();
  }

  private handleDedicatedAccess() {
    this.router.navigate([this.dedicatedConsentPage], { relativeTo: this.activatedRoute });
    return;
  }

  private moveToReviewConsent() {
    this.router.navigate([this.consentReviewPage], { relativeTo: this.activatedRoute });
  }
}

export class Access {
  constructor(public id: AccountAccessLevel, public message: string) {}
}
