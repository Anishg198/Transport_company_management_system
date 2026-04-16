package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
class AuthControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @Test
    void login_ShouldReturnToken_WhenCredentialsValid() throws Exception {
        User user = User.builder()
                .userId(UUID.randomUUID())
                .username("testuser")
                .passwordHash("hashedpassword")
                .role(User.UserRole.BranchOperator)
                .isActive(true)
                .approvalStatus("APPROVED")
                .build();

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashedpassword")).thenReturn(true);
        when(jwtUtil.generateToken(any(), anyString(), anyString())).thenReturn("mock-token");

        Map<String, String> loginRequest = Map.of(
                "username", "testuser",
                "password", "password"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-token"))
                .andExpect(jsonPath("$.user.username").value("testuser"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_ShouldCreateUser() throws Exception {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashedpassword");

        Map<String, String> registerRequest = Map.of(
                "username", "newuser",
                "password", "password",
                "name", "New User"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    void me_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_ShouldReturnUser_WhenAuthenticated() throws Exception {
        User user = User.builder()
                .userId(UUID.randomUUID())
                .username("testuser")
                .role(User.UserRole.BranchOperator)
                .name("Test User")
                .build();
        var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(user, null, java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_BranchOperator")));

        mockMvc.perform(get("/api/auth/me").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication(auth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username").value("testuser"));
    }
}
