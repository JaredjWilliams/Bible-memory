package org.biblememory.service;

import org.biblememory.model.Note;
import org.biblememory.repository.NoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final VerseService verseService;

    public NoteService(NoteRepository noteRepository, VerseService verseService) {
        this.noteRepository = noteRepository;
        this.verseService = verseService;
    }

    @Transactional(readOnly = true)
    public List<Note> findByVerseIdAndUserId(Long verseId, Long userId) {
        if (!verseService.existsByIdAndUserId(verseId, userId)) {
            return List.of();
        }
        return noteRepository.findByVerseIdAndUserIdOrderByCreatedAtAsc(verseId, userId);
    }

    @Transactional
    public Note create(Long verseId, Long userId, String content) {
        if (!verseService.existsByIdAndUserId(verseId, userId)) {
            return null;
        }
        Note note = new Note();
        note.setVerseId(verseId);
        note.setUserId(userId);
        note.setContent(content != null ? content.trim() : "");
        return noteRepository.save(note);
    }

    @Transactional
    public Note update(Long id, Long userId, String content) {
        Note note = noteRepository.findById(id).orElse(null);
        if (note == null || !note.getUserId().equals(userId)) {
            return null;
        }
        note.setContent(content != null ? content.trim() : "");
        return noteRepository.save(note);
    }

    @Transactional
    public boolean delete(Long id, Long userId) {
        if (!noteRepository.existsByIdAndUserId(id, userId)) {
            return false;
        }
        noteRepository.deleteById(id);
        return true;
    }
}
