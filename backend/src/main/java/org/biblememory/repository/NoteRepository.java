package org.biblememory.repository;

import org.biblememory.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByVerseIdAndUserIdOrderByCreatedAtAsc(Long verseId, Long userId);

    boolean existsByIdAndUserId(Long id, Long userId);
}
