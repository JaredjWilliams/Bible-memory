package org.biblememory.repository;

import org.biblememory.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Import(BCryptPasswordEncoder.class)
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void saveAndFindByUsername() {
        User user = new User();
        user.setUsername("alice");
        user.setPasswordHash(passwordEncoder.encode("secret"));
        user = userRepository.save(user);

        Optional<User> found = userRepository.findByUsername("alice");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(user.getId());
    }

    @Test
    void existsByUsername_returnsTrueWhenExists() {
        User user = new User();
        user.setUsername("bob");
        user.setPasswordHash("hash");
        userRepository.save(user);

        assertThat(userRepository.existsByUsername("bob")).isTrue();
    }

    @Test
    void existsByUsername_returnsFalseWhenNotExists() {
        assertThat(userRepository.existsByUsername("nonexistent")).isFalse();
    }
}
