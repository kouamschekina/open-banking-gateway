package de.adorsys.opba.db.domain.entity;

import de.adorsys.opba.db.domain.entity.fintech.FintechPubKey;
import de.adorsys.opba.db.domain.entity.psu.Psu;
import de.adorsys.opba.db.domain.entity.sessions.ServiceSession;
import de.adorsys.opba.db.domain.generators.AssignedUuidGenerator;
import de.adorsys.opba.protocol.api.services.EncryptionService;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GenericGenerator(
            name = AssignedUuidGenerator.ASSIGNED_ID_GENERATOR,
            strategy = AssignedUuidGenerator.ASSIGNED_ID_STRATEGY
    )
    @GeneratedValue(
            generator = AssignedUuidGenerator.ASSIGNED_ID_GENERATOR,
            strategy = GenerationType.AUTO
    )
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    private ServiceSession serviceSession;

    @ManyToOne(fetch = FetchType.LAZY)
    private Bank aspsp;

    /**
     * If the payment encryption key can be identified by the PSU + ASPSP encryption key.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    private Psu psu;

    /**
     * If the payment encryption key can be identified by Key ID stored in FinTech keystore (anonymous payment).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    private FintechPubKey fintechPubKey;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false)
    private byte[] encPaymentId;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false)
    private byte[] encContext;

    private boolean confirmed;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant modifiedAt;

    public String getContext(EncryptionService encryption) {
        return new String(encryption.decrypt(encContext), StandardCharsets.UTF_8);
    }

    public void setContext(EncryptionService encryption, String context) {
        this.encContext = encryption.encrypt(context.getBytes(StandardCharsets.UTF_8));
    }

    public String getPaymentId(EncryptionService encryption) {
        return new String(encryption.decrypt(encPaymentId), StandardCharsets.UTF_8);
    }

    public void setPaymentId(EncryptionService encryption, String consent) {
        this.encPaymentId = encryption.encrypt(consent.getBytes(StandardCharsets.UTF_8));
    }
}

