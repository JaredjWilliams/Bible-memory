package org.biblememory.repository;

import org.biblememory.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    List<Collection> findByProfile_IdOrderByCreatedAtAsc(Long profileId);

    boolean existsByIdAndProfile_UserId(Long id, Long userId);
}
