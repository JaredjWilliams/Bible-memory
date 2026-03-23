package org.biblememory.service;

import org.biblememory.model.Note;
import org.biblememory.repository.NoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private VerseService verseService;

    @InjectMocks
    private NoteService noteService;

    @Test
    void findByVerseIdAndUserId_returnsNotesWhenVerseExistsForUser() {
        when(verseService.existsByIdAndUserId(1L, 10L)).thenReturn(true);
        Note note = createNote(1L, 1L, 10L, "my note");
        when(noteRepository.findByVerseIdAndUserIdOrderByCreatedAtAsc(1L, 10L))
                .thenReturn(List.of(note));

        List<Note> result = noteService.findByVerseIdAndUserId(1L, 10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getContent()).isEqualTo("my note");
    }

    @Test
    void findByVerseIdAndUserId_returnsEmptyWhenVerseDoesNotExistForUser() {
        when(verseService.existsByIdAndUserId(1L, 10L)).thenReturn(false);

        List<Note> result = noteService.findByVerseIdAndUserId(1L, 10L);

        assertThat(result).isEmpty();
        verify(noteRepository, never()).findByVerseIdAndUserIdOrderByCreatedAtAsc(any(), any());
    }

    @Test
    void create_returnsNoteWhenVerseExists() {
        when(verseService.existsByIdAndUserId(1L, 10L)).thenReturn(true);
        Note saved = createNote(5L, 1L, 10L, "new content");
        when(noteRepository.save(any(Note.class))).thenReturn(saved);

        Note result = noteService.create(1L, 10L, "new content");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("new content");
        verify(noteRepository).save(argThat(n -> n.getVerseId().equals(1L) && n.getUserId().equals(10L)));
    }

    @Test
    void create_returnsNullWhenVerseDoesNotExist() {
        when(verseService.existsByIdAndUserId(1L, 10L)).thenReturn(false);

        Note result = noteService.create(1L, 10L, "content");

        assertThat(result).isNull();
        verify(noteRepository, never()).save(any());
    }

    @Test
    void update_returnsUpdatedNoteWhenOwnsIt() {
        Note existing = createNote(5L, 1L, 10L, "old");
        when(noteRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        Note result = noteService.update(5L, 10L, "updated");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("updated");
        verify(noteRepository).save(existing);
    }

    @Test
    void update_returnsNullWhenNoteNotFound() {
        when(noteRepository.findById(99L)).thenReturn(Optional.empty());

        Note result = noteService.update(99L, 10L, "content");

        assertThat(result).isNull();
        verify(noteRepository, never()).save(any());
    }

    @Test
    void update_returnsNullWhenWrongUser() {
        Note existing = createNote(5L, 1L, 99L, "old"); // owned by user 99
        when(noteRepository.findById(5L)).thenReturn(Optional.of(existing));

        Note result = noteService.update(5L, 10L, "hacked");

        assertThat(result).isNull();
        verify(noteRepository, never()).save(any());
    }

    @Test
    void delete_returnsTrueWhenExistsAndOwns() {
        when(noteRepository.existsByIdAndUserId(5L, 10L)).thenReturn(true);

        boolean result = noteService.delete(5L, 10L);

        assertThat(result).isTrue();
        verify(noteRepository).deleteById(5L);
    }

    @Test
    void delete_returnsFalseWhenNotOwned() {
        when(noteRepository.existsByIdAndUserId(5L, 10L)).thenReturn(false);

        boolean result = noteService.delete(5L, 10L);

        assertThat(result).isFalse();
        verify(noteRepository, never()).deleteById(any());
    }

    private Note createNote(Long id, Long verseId, Long userId, String content) {
        Note n = new Note();
        n.setId(id);
        n.setVerseId(verseId);
        n.setUserId(userId);
        n.setContent(content);
        n.setCreatedAt(Instant.now());
        n.setUpdatedAt(Instant.now());
        return n;
    }
}
