package com.tccs.repository;

import com.tccs.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<ChatMessage, UUID> {

    // Get full conversation between two users (messages in both directions)
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :a AND m.recipientId = :b) OR (m.senderId = :b AND m.recipientId = :a) " +
           "ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversation(@Param("a") UUID a, @Param("b") UUID b);

    // Poll for new messages in a conversation since a timestamp
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "((m.senderId = :a AND m.recipientId = :b) OR (m.senderId = :b AND m.recipientId = :a)) " +
           "AND m.sentAt > :since ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversationSince(@Param("a") UUID a, @Param("b") UUID b,
                                            @Param("since") OffsetDateTime since);

    // Get the latest message in a conversation (for inbox preview)
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderId = :a AND m.recipientId = :b) OR (m.senderId = :b AND m.recipientId = :a) " +
           "ORDER BY m.sentAt DESC")
    List<ChatMessage> findLatestInConversation(@Param("a") UUID a, @Param("b") UUID b);
}
