package com.tccs.controller;

import com.tccs.config.SecurityConfig;
import com.tccs.security.JwtAuthFilter;
import com.tccs.security.JwtUtil;
import com.tccs.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.invocation.InvocationOnMock;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@Import(SecurityConfig.class)
public abstract class AbstractControllerTest {

    @MockBean
    protected JwtAuthFilter jwtAuthFilter;

    @MockBean
    protected JwtUtil jwtUtil;

    @MockBean
    protected UserRepository userRepository;

    @BeforeEach
    void setUpAbstract() throws Exception {
        doAnswer((InvocationOnMock invocation) -> {
            HttpServletRequest request = invocation.getArgument(0);
            HttpServletResponse response = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(request, response);
            return null;
        }).when(jwtAuthFilter).doFilter(any(), any(), any());
    }
}
