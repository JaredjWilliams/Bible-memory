package org.biblememory.repository;

import org.biblememory.model.Collection;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    @EntityGraph(attributePaths = {"parent"})
    List<Collection> findByProfile_IdOrderByCreatedAtAsc(Long profileId);

    List<Collection> findByParent_Id(Long parentId);

    boolean existsByIdAndProfile_UserId(Long id, Long userId);
}
