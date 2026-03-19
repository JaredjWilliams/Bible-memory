package org.biblememory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.biblememory.security.JwtService;
import org.biblememory.service.AuthService;
import org.biblememory.service.AuthResult;
import org.biblememory.service.RateLimitService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private RateLimitService rateLimitService;

    @MockBean
    private JwtService jwtService;

    @Test
    void signup_returnsToken() throws Exception {
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.signup("alice", "password123"))
                .thenReturn(AuthResult.success("jwt-token", "alice"));

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void signup_returns409WhenUsernameExists() throws Exception {
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.signup("alice", "password123")).thenReturn(AuthResult.duplicateUser());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"password123\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("USERNAME_EXISTS"));
    }

    @Test
    void signup_returns400WhenPasswordTooShort() throws Exception {
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void login_returnsToken() throws Exception {
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login("alice", "password123"))
                .thenReturn(AuthResult.success("jwt-token", "alice"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void login_returns401WhenInvalidCredentials() throws Exception {
        when(rateLimitService.tryConsume(anyString())).thenReturn(true);
        when(authService.login("alice", "wrong")).thenReturn(AuthResult.failure());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"alice\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_FAILED"));
    }
}
