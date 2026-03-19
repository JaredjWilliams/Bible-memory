package org.biblememory.repository;

import org.biblememory.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    List<Profile> findByUserIdOrderByCreatedAtAsc(Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
