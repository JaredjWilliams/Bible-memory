package org.biblememory.service;

import org.biblememory.model.ReaderNote;
import org.biblememory.repository.ReaderNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReaderNoteService {

    private final ReaderNoteRepository readerNoteRepository;

    public ReaderNoteService(ReaderNoteRepository readerNoteRepository) {
        this.readerNoteRepository = readerNoteRepository;
    }

    @Transactional(readOnly = true)
    public List<ReaderNote> findByChapter(Long userId, String book, int chapter) {
        return readerNoteRepository.findByUserIdAndBookAndChapterOrderByCreatedAtDesc(userId, book, chapter);
    }

    @Transactional
    public ReaderNote create(Long userId, String book, int chapter, String verseRange, String content) {
        ReaderNote note = new ReaderNote();
        note.setUserId(userId);
        note.setBook(book);
        note.setChapter(chapter);
        note.setVerseRange(verseRange);
        note.setContent(content != null ? content.trim() : "");
        return readerNoteRepository.save(note);
    }

    @Transactional
    public ReaderNote update(Long id, Long userId, String content) {
        ReaderNote note = readerNoteRepository.findById(id).orElse(null);
        if (note == null || !note.getUserId().equals(userId)) {
            return null;
        }
        note.setContent(content != null ? content.trim() : "");
        return readerNoteRepository.save(note);
    }

    @Transactional
    public boolean delete(Long id, Long userId) {
        if (!readerNoteRepository.existsByIdAndUserId(id, userId)) {
            return false;
        }
        readerNoteRepository.deleteById(id);
        return true;
    }
}
