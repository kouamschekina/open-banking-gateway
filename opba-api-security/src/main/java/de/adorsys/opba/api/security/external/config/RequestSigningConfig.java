package de.adorsys.opba.api.security.external.config;

import de.adorsys.opba.api.security.external.service.RequestSigningService;
import de.adorsys.opba.api.security.external.service.RsaJwtsSigningServiceImpl;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;

import jakarta.validation.constraints.NotBlank;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

@Data
@Slf4j
public class RequestSigningConfig {
    @NotBlank
    private String encodedPrivateKey;
    @NotBlank
    private String signIssuer;
    @NotBlank
    private String signSubject;
    @NotBlank
    private String algorithm;
    @NotBlank
    private String claimNameKey;

    @Bean
    public RequestSigningService requestSigningService() {
        return new RsaJwtsSigningServiceImpl(parsePrivateKey(), signIssuer, signSubject, claimNameKey);
    }

    private PrivateKey parsePrivateKey() {
        try {
            PKCS8EncodedKeySpec encodedPrivateKeySpec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(encodedPrivateKey));
            KeyFactory keyFact = KeyFactory.getInstance(algorithm);
            return keyFact.generatePrivate(encodedPrivateKeySpec);
        } catch (InvalidKeySpecException | NoSuchAlgorithmException e) {
            String message = String.format("Encoded private key has wrong format :  %s ", e);
            log.error(message);
            throw new IllegalArgumentException(e);
        }
    }
}
