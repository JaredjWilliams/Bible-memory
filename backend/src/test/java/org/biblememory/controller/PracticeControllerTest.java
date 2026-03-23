package org.biblememory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.biblememory.security.JwtService;
import org.biblememory.security.WithUserId;
import org.biblememory.service.SpacedRepetitionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PracticeController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class PracticeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SpacedRepetitionService spacedRepetitionService;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithUserId
    void recordResult_returns204WhenAuthenticatedWithValidRequest() throws Exception {
        String body = """
            {
                "verseIds": [1, 2],
                "accuracy": 100.0,
                "completed": true,
                "incrementInterval": true
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());

        verify(spacedRepetitionService).recordPractice(eq(1L), eq(List.of(1L, 2L)), eq(100.0), eq(true), eq(true));
    }

    @Test
    void recordResult_returns401WhenNotAuthenticated() throws Exception {
        String body = """
            {
                "verseIds": [1],
                "accuracy": 100.0,
                "completed": true,
                "incrementInterval": false
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void recordResult_returns400WhenVerseIdsEmpty() throws Exception {
        String body = """
            {
                "verseIds": [],
                "accuracy": 100.0,
                "completed": true,
                "incrementInterval": false
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void recordResult_returns400WhenAccuracyMissing() throws Exception {
        String body = """
            {
                "verseIds": [1],
                "completed": true,
                "incrementInterval": false
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void recordResult_returns400WhenAccuracyOutOfRange() throws Exception {
        String body = """
            {
                "verseIds": [1],
                "accuracy": 150.0,
                "completed": true,
                "incrementInterval": false
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void recordResult_returns400WhenCompletedMissing() throws Exception {
        String body = """
            {
                "verseIds": [1],
                "accuracy": 100.0,
                "incrementInterval": false
            }
            """;

        mockMvc.perform(post("/api/practice/result")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void getDueVerses_returns200WhenAuthenticated() throws Exception {
        mockMvc.perform(get("/api/practice/due"))
                .andExpect(status().isOk());
    }

    @Test
    @WithUserId
    void getDueVerses_returns200WithCollectionFilter() throws Exception {
        mockMvc.perform(get("/api/practice/due").param("collectionId", "5"))
                .andExpect(status().isOk());
    }

    @Test
    void getDueVerses_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/practice/due"))
                .andExpect(status().isUnauthorized());
    }
}
