package org.biblememory.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.biblememory.controller.dto.AuthResponse;
import org.biblememory.controller.dto.LoginRequest;
import org.biblememory.controller.dto.SignupRequest;
import org.biblememory.service.AuthService;
import org.biblememory.service.AuthResult;
import org.biblememory.service.RateLimitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    public AuthController(AuthService authService, RateLimitService rateLimitService) {
        this.authService = authService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request, HttpServletRequest httpRequest) {
        if (!rateLimitService.tryConsume(httpRequest.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new org.biblememory.model.ApiError("RATE_LIMIT_EXCEEDED", "Too many attempts. Try again later."));
        }
        AuthResult result = authService.signup(request.username(), request.password());
        if (result.duplicateUsername()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new org.biblememory.model.ApiError("USERNAME_EXISTS", "Username already exists"));
        }
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new org.biblememory.model.ApiError("AUTH_FAILED", "Invalid credentials"));
        }
        return ResponseEntity.ok(new AuthResponse(result.token(), result.username()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        if (!rateLimitService.tryConsume(httpRequest.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new org.biblememory.model.ApiError("RATE_LIMIT_EXCEEDED", "Too many attempts. Try again later."));
        }
        AuthResult result = authService.login(request.username(), request.password());
        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new org.biblememory.model.ApiError("AUTH_FAILED", "Invalid username or password"));
        }
        return ResponseEntity.ok(new AuthResponse(result.token(), result.username()));
    }
}
