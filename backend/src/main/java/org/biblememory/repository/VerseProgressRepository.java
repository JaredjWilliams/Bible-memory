package org.biblememory.repository;

import org.biblememory.model.VerseProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VerseProgressRepository extends JpaRepository<VerseProgress, Long> {

    Optional<VerseProgress> findByVerseIdAndUserId(Long verseId, Long userId);

    List<VerseProgress> findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(Long userId, Instant instant);

    void deleteByVerseId(Long verseId);
}
