package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.User;
import com.tccs.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
class UserControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void getAll_ShouldReturnList() throws Exception {
        User u = User.builder().userId(UUID.randomUUID()).username("test").role(User.UserRole.BranchOperator).createdAt(java.time.OffsetDateTime.now()).build();
        when(userRepository.findAll()).thenReturn(new java.util.ArrayList<>(List.of(u)));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.users").isArray());
    }

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void create_ShouldReturnCreated() throws Exception {
        Map<String, Object> body = Map.of(
                "username", "newuser",
                "password", "pass123",
                "role", "BranchOperator",
                "name", "New User"
        );
        when(userRepository.existsByUsername("newuser")).thenReturn(false);

        mockMvc.perform(post("/api/users")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user").exists());

        verify(userRepository).save(any());
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void getAll_ShouldReturnForbiddenForManager() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void approve_ShouldReturnOk() throws Exception {
        UUID id = UUID.randomUUID();
        User u = User.builder().userId(id).role(User.UserRole.BranchOperator).approvalStatus("PENDING").build();
        when(userRepository.findById(id)).thenReturn(Optional.of(u));

        mockMvc.perform(patch("/api/users/" + id + "/approve").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.approval_status").value("APPROVED"));

        verify(userRepository).save(any());
    }
}
