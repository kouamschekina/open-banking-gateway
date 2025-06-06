package de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.stress;

import com.tngtech.jgiven.junit5.ScenarioTest;
import de.adorsys.opba.protocol.xs2a.tests.e2e.stages.AccountInformationResult;
import de.adorsys.opba.protocol.xs2a.tests.e2e.stages.CommonGivenStages;
import de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.mocks.WiremockAccountInformationRequest;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.mocks.WiremockConst.BOTH_BOOKING;
import static de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.mocks.WiremockConst.DATE_FROM;
import static de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.mocks.WiremockConst.DATE_TO;
import static de.adorsys.opba.protocol.xs2a.tests.e2e.wiremock.mocks.WiremockConst.MAX_MUSTERMAN_RESOURCE_ID;

/**
 * This is not really a test, just steps supplier.
 */
@Disabled
class E2EStress extends ScenarioTest<CommonGivenStages<? extends CommonGivenStages<?>>, WiremockAccountInformationRequest<? extends WiremockAccountInformationRequest<?>>, AccountInformationResult> {

    // need to find way to inject spring beans for load test, currently using static hack
    public static final AtomicReference<AutowireCapableBeanFactory> PARENT_SPRING_CTX_AUTOWIRER = new AtomicReference<>();

    private final String ACCOUNTS_OPBA_USERNAME = UUID.randomUUID().toString();
    private final String ACCOUNTS_OPBA_PASSWORD = UUID.randomUUID().toString();
    private final String TRANSACTIONS_OPBA_USERNAME = UUID.randomUUID().toString();
    private final String TRANSACTIONS_OPBA_PASSWORD = UUID.randomUUID().toString();

    @Test
    void embeddedAccountList() {
        // Injecting parent spring context
        prepareContext();

        given()
            .user_registered_in_opba_with_credentials(ACCOUNTS_OPBA_USERNAME, ACCOUNTS_OPBA_PASSWORD);

        when()
            .fintech_calls_list_accounts_for_max_musterman()
            .and()
            .user_logged_in_into_opba_as_opba_user_with_credentials_using_fintech_supplied_url(ACCOUNTS_OPBA_USERNAME, ACCOUNTS_OPBA_PASSWORD)
            .and()
            .user_max_musterman_provided_initial_parameters_to_list_accounts_all_accounts_consent()
            .and()
            .user_max_musterman_provided_password_to_embedded_authorization()
            .and()
            .user_max_musterman_selected_sca_challenge_type_email2_to_embedded_authorization()
            .and()
            .user_max_musterman_provided_sca_challenge_result_to_embedded_authorization_and_sees_redirect_to_fintech_ok();

        then()
            .fintech_calls_consent_activation_for_current_authorization_id()
            .open_banking_can_read_max_musterman_account_data_using_consent_bound_to_service_session();
    }

    @Test
    void embeddedTransactionList() {
        // Injecting parent spring context
        prepareContext();

        given()
            .user_registered_in_opba_with_credentials(TRANSACTIONS_OPBA_USERNAME, TRANSACTIONS_OPBA_PASSWORD);

        when()
            .fintech_calls_list_transactions_for_max_musterman()
            .and()
            .user_logged_in_into_opba_as_opba_user_with_credentials_using_fintech_supplied_url(TRANSACTIONS_OPBA_USERNAME, TRANSACTIONS_OPBA_PASSWORD)
            .and()
            .user_max_musterman_provided_initial_parameters_to_list_transactions_with_single_account_consent()
            .and()
            .user_max_musterman_provided_password_to_embedded_authorization()
            .and()
            .user_max_musterman_selected_sca_challenge_type_email1_to_embedded_authorization()
            .and()
            .user_max_musterman_provided_sca_challenge_result_to_embedded_authorization_and_sees_redirect_to_fintech_ok();

        then()
            .fintech_calls_consent_activation_for_current_authorization_id()
            .open_banking_can_read_max_musterman_transactions_data_using_consent_bound_to_service_session(
                MAX_MUSTERMAN_RESOURCE_ID, DATE_FROM, DATE_TO, BOTH_BOOKING
            );
    }

    private void prepareContext() {
        PARENT_SPRING_CTX_AUTOWIRER.get().autowireBean(this.given());
        PARENT_SPRING_CTX_AUTOWIRER.get().autowireBean(this.when());
        PARENT_SPRING_CTX_AUTOWIRER.get().autowireBean(this.then());
        PARENT_SPRING_CTX_AUTOWIRER.get().autowireBean(this);
    }
}
