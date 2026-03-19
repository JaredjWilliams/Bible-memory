package org.biblememory.service;

import org.biblememory.model.User;
import org.biblememory.repository.UserRepository;
import org.biblememory.security.JwtService;
import org.biblememory.service.AuthResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void signup_createsUserAndReturnsToken() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken("alice", 1L)).thenReturn("jwt-token");

        AuthResult result = authService.signup("alice", "password123");

        assertThat(result.success()).isTrue();
        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.username()).isEqualTo("alice");
        assertThat(result.duplicateUsername()).isFalse();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void signup_returnsDuplicateWhenUsernameExists() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        AuthResult result = authService.signup("alice", "password123");

        assertThat(result.success()).isFalse();
        assertThat(result.duplicateUsername()).isTrue();
        verify(userRepository).existsByUsername("alice");
    }

    @Test
    void login_returnsTokenWhenCredentialsValid() {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setPasswordHash("hashed");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtService.generateToken("alice", 1L)).thenReturn("jwt-token");

        AuthResult result = authService.login("alice", "password123");

        assertThat(result.success()).isTrue();
        assertThat(result.token()).isEqualTo("jwt-token");
    }

    @Test
    void login_returnsFailureWhenUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        AuthResult result = authService.login("unknown", "password");

        assertThat(result.success()).isFalse();
    }

    @Test
    void login_returnsFailureWhenPasswordWrong() {
        User user = new User();
        user.setPasswordHash("hashed");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        AuthResult result = authService.login("alice", "wrong");

        assertThat(result.success()).isFalse();
    }
}
