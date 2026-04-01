package com.tccs.controller;

import com.tccs.model.ChatMessage;
import com.tccs.model.User;
import com.tccs.repository.ChatRepository;
import com.tccs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    // Get users the current user can chat with
    @GetMapping("/users")
    public ResponseEntity<?> getChatUsers(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();

        List<User> targets;
        if (user.getRole() == User.UserRole.BranchOperator) {
            // Operators chat with Managers and Admins
            targets = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.UserRole.TransportManager
                              || u.getRole() == User.UserRole.SystemAdministrator)
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                    .collect(Collectors.toList());
        } else if (user.getRole() == User.UserRole.TransportManager) {
            // Managers chat with Operators and Admins
            targets = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == User.UserRole.BranchOperator
                              || u.getRole() == User.UserRole.SystemAdministrator)
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                    .collect(Collectors.toList());
        } else {
            // Admin can chat with everyone
            targets = userRepository.findAll().stream()
                    .filter(u -> !u.getUserId().equals(user.getUserId()))
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                    .collect(Collectors.toList());
        }

        // Attach latest message preview for each user
        List<Map<String, Object>> result = targets.stream().map(target -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("user_id", target.getUserId());
            m.put("name", target.getName());
            m.put("username", target.getUsername());
            m.put("role", target.getRole().name());
            m.put("branch_location", target.getBranchLocation());

            List<ChatMessage> latest = chatRepository.findLatestInConversation(user.getUserId(), target.getUserId());
            if (!latest.isEmpty()) {
                ChatMessage last = latest.get(0);
                m.put("last_message", last.getContent());
                m.put("last_message_at", last.getSentAt());
                m.put("last_message_mine", last.getSenderId().equals(user.getUserId()));
            }
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("users", result));
    }

    // Get conversation with a specific user
    @GetMapping("/messages")
    public ResponseEntity<?> getMessages(@RequestParam UUID with,
                                          @RequestParam(required = false) String since,
                                          @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();

        List<ChatMessage> messages;
        if (since != null && !since.isBlank()) {
            messages = chatRepository.findConversationSince(user.getUserId(), with, OffsetDateTime.parse(since));
        } else {
            messages = chatRepository.findConversation(user.getUserId(), with);
        }

        return ResponseEntity.ok(Map.of("messages", messages.stream().map(this::toMap).collect(Collectors.toList())));
    }

    // Send a message to a specific user
    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, String> body,
                                          @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();

        String content = body.get("content");
        if (content == null || content.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "content is required"));

        String recipientIdStr = body.get("recipientId");
        if (recipientIdStr == null || recipientIdStr.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "recipientId is required"));

        UUID recipientId = UUID.fromString(recipientIdStr);
        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Recipient not found"));

        ChatMessage msg = ChatMessage.builder()
                .senderId(user.getUserId())
                .senderName(user.getName())
                .senderRole(user.getRole().name())
                .recipientId(recipientId)
                .recipientName(recipient.getName())
                .content(content.trim())
                .sentAt(OffsetDateTime.now())
                .consignmentRef(body.get("consignmentRef"))
                .build();

        chatRepository.save(msg);
        return ResponseEntity.status(201).body(toMap(msg));
    }

    private Map<String, Object> toMap(ChatMessage m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("message_id", m.getMessageId());
        map.put("sender_id", m.getSenderId());
        map.put("sender_name", m.getSenderName());
        map.put("sender_role", m.getSenderRole());
        map.put("recipient_id", m.getRecipientId());
        map.put("recipient_name", m.getRecipientName());
        map.put("content", m.getContent());
        map.put("sent_at", m.getSentAt());
        map.put("consignment_ref", m.getConsignmentRef());
        return map;
    }
}
