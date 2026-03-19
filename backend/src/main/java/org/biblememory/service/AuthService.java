package org.biblememory.service;

import org.biblememory.model.User;
import org.biblememory.repository.UserRepository;
import org.biblememory.security.JwtService;
import org.biblememory.service.AuthResult;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResult signup(String username, String password) {
        if (userRepository.existsByUsername(username)) {
            return AuthResult.duplicateUser();
        }
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user = userRepository.save(user);
        String token = jwtService.generateToken(user.getUsername(), user.getId());
        return AuthResult.success(token, user.getUsername());
    }

    public AuthResult login(String username, String password) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            return AuthResult.failure();
        }
        String token = jwtService.generateToken(user.getUsername(), user.getId());
        return AuthResult.success(token, user.getUsername());
    }

}
