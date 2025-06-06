package de.adorsys.opba.api.security.internal.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import java.util.Set;

@Data
@Validated
@Configuration
@ConfigurationProperties(prefix = ConfigConst.API_CONFIG_PREFIX + "cookie")
public class CookieProperties {
    private boolean secure = true;
    private boolean httpOnly = true;
    private String path = "/";
    private String redirectPathTemplate = "/";

    @NotNull
    private Duration maxAge;

    @NotNull
    private Duration redirectMaxAge;

    @NotBlank
    private String sameSite;

    @NotEmpty
    private Set<@NotBlank String> urlsToBeValidated;
}
