package org.biblememory.controller;

import org.biblememory.model.Note;
import org.biblememory.security.JwtService;
import org.biblememory.security.WithUserId;
import org.biblememory.service.NoteService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NoteController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NoteService noteService;

    @MockBean
    private JwtService jwtService;

    private static Note createNote(Long id, Long verseId, Long userId, String content) {
        Note n = new Note();
        n.setId(id);
        n.setVerseId(verseId);
        n.setUserId(userId);
        n.setContent(content);
        n.setCreatedAt(Instant.now());
        n.setUpdatedAt(Instant.now());
        return n;
    }

    @Test
    @WithUserId
    void list_returns200WithNotesWhenAuthenticated() throws Exception {
        Note note = createNote(1L, 10L, 1L, "My note content");
        when(noteService.findByVerseIdAndUserId(10L, 1L)).thenReturn(List.of(note));

        mockMvc.perform(get("/api/notes").param("verseId", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].verseId").value(10))
                .andExpect(jsonPath("$[0].content").value("My note content"));

        verify(noteService).findByVerseIdAndUserId(10L, 1L);
    }

    @Test
    void list_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/notes").param("verseId", "10"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns201WithCreatedNoteWhenAuthenticated() throws Exception {
        Note note = createNote(1L, 10L, 1L, "New note");
        when(noteService.create(10L, 1L, "New note")).thenReturn(note);

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"verseId\":10,\"content\":\"New note\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.content").value("New note"));

        verify(noteService).create(10L, 1L, "New note");
    }

    @Test
    void create_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"verseId\":10,\"content\":\"New note\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns404WhenVerseNotFound() throws Exception {
        when(noteService.create(999L, 1L, "Note")).thenReturn(null);

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"verseId\":999,\"content\":\"Note\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void create_returns400WhenContentBlank() throws Exception {
        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"verseId\":10,\"content\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void create_returns400WhenVerseIdNull() throws Exception {
        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Note\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void update_returns200WithUpdatedNoteWhenAuthenticated() throws Exception {
        Note note = createNote(1L, 10L, 1L, "Updated content");
        when(noteService.update(1L, 1L, "Updated content")).thenReturn(note);

        mockMvc.perform(put("/api/notes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Updated content\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("Updated content"));

        verify(noteService).update(1L, 1L, "Updated content");
    }

    @Test
    void update_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(put("/api/notes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Updated\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void update_returns404WhenNoteNotFound() throws Exception {
        when(noteService.update(999L, 1L, "Content")).thenReturn(null);

        mockMvc.perform(put("/api/notes/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"Content\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void update_returns400WhenContentBlank() throws Exception {
        mockMvc.perform(put("/api/notes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void delete_returns204WhenAuthenticatedAndNoteExists() throws Exception {
        when(noteService.delete(1L, 1L)).thenReturn(true);

        mockMvc.perform(delete("/api/notes/1"))
                .andExpect(status().isNoContent());

        verify(noteService).delete(1L, 1L);
    }

    @Test
    void delete_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/api/notes/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void delete_returns404WhenNoteNotFound() throws Exception {
        when(noteService.delete(999L, 1L)).thenReturn(false);

        mockMvc.perform(delete("/api/notes/999"))
                .andExpect(status().isNotFound());
    }
}
