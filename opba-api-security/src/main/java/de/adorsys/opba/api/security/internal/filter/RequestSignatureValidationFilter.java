package de.adorsys.opba.api.security.internal.filter;

import com.google.common.io.CharStreams;
import de.adorsys.opba.api.security.external.domain.FilterValidationHeaderValues;
import de.adorsys.opba.api.security.external.domain.HttpHeaders;
import de.adorsys.opba.api.security.generator.api.DataToSignProvider;
import de.adorsys.opba.api.security.generator.api.RequestDataToSignNormalizer;
import de.adorsys.opba.api.security.generator.api.RequestToSign;
import de.adorsys.opba.api.security.internal.service.RequestVerifyingService;
import de.adorsys.opba.api.security.requestsigner.OpenBankingDataToSignProvider;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentMap;

/**
 * This class validates 'X-Request-Signature' header of the incoming request from fintech.
 * The signature verification happens: all required fields(headers/query params) must be present
 * and request timestamp should be within the range of security.verification.request-validity-window property.
 * The filter can be disabled by using 'no-signature-filter' spring active profile.
 */
@SuppressWarnings("PMD.UselessOperationOnImmutable")
@Slf4j
public class RequestSignatureValidationFilter implements Filter {
    private final RequestVerifyingService requestVerifyingService;
    private final Duration requestTimeLimit;
    private final ConcurrentMap<String, String> consumerKeysMap;

    public RequestSignatureValidationFilter(RequestVerifyingService requestVerifyingService, Duration requestTimeLimit,
                                            ConcurrentMap<String, String> consumerKeysMap) {
        this.requestVerifyingService = requestVerifyingService;
        this.requestTimeLimit = requestTimeLimit;
        this.consumerKeysMap = consumerKeysMap;
    }

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain filterChain) throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        FilterValidationHeaderValues headerValues = buildRequestValidationData(request);

        if (isUnparsableRequestTimeStamp(headerValues.getRequestTimeStamp(), response)
                    || isMissingFintechId(headerValues.getFintechId(), response)
                    || isUnparsableXRequestId(headerValues.getXRequestId(), response)) {
            return;
        }

        Instant instant = Instant.parse(headerValues.getRequestTimeStamp());
        String fintechApiKey = consumerKeysMap.get(headerValues.getFintechId());

        if (isMissingFintechApiKey(fintechApiKey, headerValues.getFintechId(), response)) {
            return;
        }

        boolean verificationResult = verifyRequestSignature(request, fintechApiKey);

        if (validateVerificationResult(verificationResult, response) && validateExpirationDate(instant, response)) {
            filterChain.doFilter(request, response);
        }
    }

    private boolean isMissingFintechApiKey(String fintechApiKey, String fintechId, HttpServletResponse response) throws IOException {
        if (fintechApiKey == null) {
            log.error("Api key for fintech ID {} has not found ", fintechId);
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Wrong Fintech ID");
            return true;
        }

        return false;
    }

    private boolean isUnparsableRequestTimeStamp(String requestTimeStamp, HttpServletResponse response) throws IOException {
        if (requestTimeStamp == null) {
            log.error("Required 'X-Timestamp-UTC' header is missing");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "X-Timestamp-UTC is missing");
            return true;
        }

        try {
            Instant.parse(requestTimeStamp);
        } catch (DateTimeParseException e) {
            log.error("'X-Timestamp-UTC' header is not a valid ISO8601 date");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Wrong X-Timestamp-UTC");
            return true;
        }

        return false;
    }

    private boolean isUnparsableXRequestId(String xRequestId, HttpServletResponse response) throws IOException {
        if (xRequestId == null) {
            log.error("Required 'X-Request-ID' header is missing");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "X-Request-ID is missing");
            return true;
        }

        try {
            UUID.fromString(xRequestId);
        } catch (IllegalArgumentException e) {
            log.error("''X-Request-ID' header is not a valid UUID");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Wrong X-Request-ID");
            return true;
        }

        return false;
    }

    private boolean isMissingFintechId(String fintechId, HttpServletResponse response) throws IOException {
        if (fintechId == null) {
            log.error("'Fintech-ID' header is missing");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Fintech ID is missing");
            return true;
        }

        return false;
    }

    private boolean validateVerificationResult(boolean verificationResult, HttpServletResponse response) throws IOException {
        if (!verificationResult) {
            log.error("Signature verification error ");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Signature verification error");
            return false;
        }

        return true;
    }

    private boolean validateExpirationDate(Instant instant, HttpServletResponse response) throws IOException {
        if (isRequestExpired(instant)) {
            log.error("Timestamp validation failed");
            response.sendError(HttpServletResponse.SC_NOT_FOUND, "Timestamp validation failed");
            return false;
        }

        return true;
    }

    @SneakyThrows
    private boolean verifyRequestSignature(HttpServletRequest request, String fintechApiKey) {
        // OpenBankingSigner - This is generated class by opba-api-security-signer-generator-impl annotation processor
        DataToSignProvider dataToSignProvider = new OpenBankingDataToSignProvider();
        String body = request.getContentLengthLong() >= 0 ? CharStreams.toString(request.getReader()) : null;
        RequestToSign toSign = RequestToSign.builder()
                .method(DataToSignProvider.HttpMethod.valueOf(request.getMethod()))
                .path(request.getRequestURI())
                .headers(extractHeaders(request))
                .queryParams(extractQueryParams(request))
                .body(body)
                .build();
        RequestDataToSignNormalizer signatureGen = dataToSignProvider.normalizerFor(toSign);
        String expectedSignature = signatureGen.canonicalStringToSign(toSign);

        return requestVerifyingService.verify(request.getHeader(HttpHeaders.X_REQUEST_SIGNATURE), fintechApiKey, expectedSignature);
    }

    private Map<String, String> extractHeaders(HttpServletRequest request) {
        Map<String, String> result = new HashMap<>();
        Enumeration<String> names = request.getHeaderNames();
        while (names.hasMoreElements()) {
            String headerName = names.nextElement();
            // Skip signature itself and other headers not relevant to signature
            if (HttpHeaders.X_REQUEST_SIGNATURE.toLowerCase().equals(headerName.toLowerCase())) {
                continue;
            }
            result.put(headerName, request.getHeader(headerName));
        }
        return result;
    }

    private Map<String, String> extractQueryParams(HttpServletRequest request) {
        Map<String, String> result = new HashMap<>();
        Enumeration<String> names = request.getParameterNames();
        while (names.hasMoreElements()) {
            String parameterName = names.nextElement();
            result.put(parameterName, request.getParameter(parameterName));
        }
        return result;
    }

    private boolean isRequestExpired(Instant operationTime) {
        Instant now = Instant.now();
        return now.plus(requestTimeLimit).isBefore(operationTime)
                       || now.minus(requestTimeLimit).isAfter(operationTime);
    }

    private FilterValidationHeaderValues buildRequestValidationData(HttpServletRequest request) {
        return FilterValidationHeaderValues.builder()
                       .fintechId(request.getHeader(HttpHeaders.FINTECH_ID))
                       .xRequestId(request.getHeader(HttpHeaders.X_REQUEST_ID))
                       .requestTimeStamp(request.getHeader(HttpHeaders.X_TIMESTAMP_UTC))
                       .build();
    }
}
