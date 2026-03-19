package org.biblememory.repository;

import org.biblememory.model.Verse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerseRepository extends JpaRepository<Verse, Long> {

    List<Verse> findByCollectionIdOrderByOrderIndexAsc(Long collectionId);

    boolean existsByIdAndCollection_Profile_UserId(Long id, Long userId);

    boolean existsByCollectionIdAndReference(Long collectionId, String reference);
}
