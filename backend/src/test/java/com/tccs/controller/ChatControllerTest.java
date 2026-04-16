package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.User;
import com.tccs.repository.ChatRepository;
import com.tccs.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChatController.class)
class ChatControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ChatRepository chatRepository;

    @Test
    void getChatUsers_ShouldReturnList() throws Exception {
        User user = User.builder().userId(UUID.randomUUID()).username("admin").role(User.UserRole.SystemAdministrator).isActive(true).build();
        var auth = new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_SystemAdministrator")));

        User u = User.builder().userId(UUID.randomUUID()).username("user1").role(User.UserRole.BranchOperator).isActive(true).build();
        when(userRepository.findAll()).thenReturn(List.of(u));

        mockMvc.perform(get("/api/chat/users").with(authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray());
    }

    @Test
    void sendMessage_ShouldReturnCreated() throws Exception {
        User user = User.builder().userId(UUID.randomUUID()).username("admin").name("Admin").role(User.UserRole.SystemAdministrator).build();
        var auth = new UsernamePasswordAuthenticationToken(user, null, List.of(new SimpleGrantedAuthority("ROLE_SystemAdministrator")));

        UUID recipientId = UUID.randomUUID();
        User recipient = User.builder().userId(recipientId).name("Recipient").build();
        when(userRepository.findById(recipientId)).thenReturn(Optional.of(recipient));

        Map<String, String> body = Map.of(
                "content", "Hello",
                "recipientId", recipientId.toString()
        );

        mockMvc.perform(post("/api/chat/messages")
                .with(authentication(auth))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Hello"));

        verify(chatRepository).save(any());
    }
}
