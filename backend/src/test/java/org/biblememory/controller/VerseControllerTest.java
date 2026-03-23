package org.biblememory.controller;

import org.biblememory.controller.dto.VerseDto;
import org.biblememory.model.Collection;
import org.biblememory.model.Profile;
import org.biblememory.model.Verse;
import org.biblememory.security.JwtService;
import org.biblememory.security.WithUserId;
import org.biblememory.service.BulkVerseService;
import org.biblememory.service.VerseService;
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

@WebMvcTest(controllers = VerseController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class VerseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VerseService verseService;

    @MockBean
    private BulkVerseService bulkVerseService;

    @MockBean
    private JwtService jwtService;

    private static Verse createVerse(Long id, Long collectionId, String reference, String text) {
        Profile profile = new Profile();
        profile.setId(1L);
        profile.setUserId(1L);
        Collection col = new Collection();
        col.setId(collectionId);
        col.setProfile(profile);
        Verse v = new Verse();
        v.setId(id);
        v.setCollection(col);
        v.setReference(reference);
        v.setText(text);
        v.setOrderIndex(0);
        v.setCreatedAt(Instant.now());
        return v;
    }

    @Test
    @WithUserId
    void list_returns200WithVersesWhenAuthenticated() throws Exception {
        Verse verse = createVerse(1L, 1L, "John 3:16", "For God so loved the world");
        when(verseService.findByCollectionId(1L, 1L)).thenReturn(List.of(verse));

        mockMvc.perform(get("/api/verses").param("collectionId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].reference").value("John 3:16"));

        verify(verseService).findByCollectionId(1L, 1L);
    }

    @Test
    void list_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/verses").param("collectionId", "1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns201WhenAuthenticated() throws Exception {
        Verse verse = createVerse(1L, 1L, "John 3:16", "For God so loved the world");
        when(verseService.create(1L, 1L, "John 3:16", "For God so loved the world", null))
                .thenReturn(verse);

        mockMvc.perform(post("/api/verses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"reference\":\"John 3:16\",\"text\":\"For God so loved the world\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.reference").value("John 3:16"));

        verify(verseService).create(1L, 1L, "John 3:16", "For God so loved the world", null);
    }

    @Test
    void create_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/verses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"reference\":\"John 3:16\",\"text\":\"text\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns404WhenCollectionNotFound() throws Exception {
        when(verseService.create(999L, 1L, "John 3:16", "text", null)).thenReturn(null);

        mockMvc.perform(post("/api/verses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":999,\"reference\":\"John 3:16\",\"text\":\"text\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void create_returns400WhenReferenceBlank() throws Exception {
        mockMvc.perform(post("/api/verses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"reference\":\"\",\"text\":\"text\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void bulkCreate_returns201WhenSuccess() throws Exception {
        Verse verse = createVerse(1L, 1L, "John 3:16", "For God so loved the world");
        VerseDto dto = new VerseDto(1L, "John 3:16", "For God so loved the world", 0, "ESV", Instant.now());
        when(bulkVerseService.bulkAdd(1L, 1L, "John 3:16-17"))
                .thenReturn(new BulkVerseService.BulkResult(List.of(dto), 0, null));

        mockMvc.perform(post("/api/verses/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"range\":\"John 3:16-17\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.added").isArray())
                .andExpect(jsonPath("$.skipped").value(0));

        verify(bulkVerseService).bulkAdd(1L, 1L, "John 3:16-17");
    }

    @Test
    void bulkCreate_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/verses/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"range\":\"John 3:16-17\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void bulkCreate_returns400WithBulkAddErrorWhenServiceReturnsError() throws Exception {
        when(bulkVerseService.bulkAdd(1L, 1L, "invalid"))
                .thenReturn(new BulkVerseService.BulkResult(List.of(), 0, "Invalid reference range"));

        mockMvc.perform(post("/api/verses/bulk")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"collectionId\":1,\"range\":\"invalid\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BULK_ADD_ERROR"));
    }

    @Test
    @WithUserId
    void update_returns200WhenVerseExists() throws Exception {
        Verse verse = createVerse(1L, 1L, "John 3:16", "Updated text");
        when(verseService.update(1L, 1L, "John 3:16", "Updated text", null)).thenReturn(verse);

        mockMvc.perform(put("/api/verses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reference\":\"John 3:16\",\"text\":\"Updated text\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Updated text"));

        verify(verseService).update(1L, 1L, "John 3:16", "Updated text", null);
    }

    @Test
    void update_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(put("/api/verses/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Updated\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void update_returns404WhenVerseNotFound() throws Exception {
        when(verseService.update(999L, 1L, null, "text", null)).thenReturn(null);

        mockMvc.perform(put("/api/verses/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"text\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void delete_returns204WhenVerseExists() throws Exception {
        Verse verse = createVerse(1L, 1L, "John 3:16", "text");
        when(verseService.findByIdAndUserId(1L, 1L)).thenReturn(verse);

        mockMvc.perform(delete("/api/verses/1"))
                .andExpect(status().isNoContent());

        verify(verseService).delete(1L, 1L);
    }

    @Test
    void delete_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/api/verses/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void delete_returns404WhenVerseNotFound() throws Exception {
        when(verseService.findByIdAndUserId(999L, 1L)).thenReturn(null);

        mockMvc.perform(delete("/api/verses/999"))
                .andExpect(status().isNotFound());
    }
}
