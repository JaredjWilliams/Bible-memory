package org.biblememory.repository;

import org.biblememory.model.ReaderNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReaderNoteRepository extends JpaRepository<ReaderNote, Long> {

    List<ReaderNote> findByUserIdAndBookAndChapterOrderByCreatedAtDesc(Long userId, String book, int chapter);

    boolean existsByIdAndUserId(Long id, Long userId);
}
