package org.biblememory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.biblememory.esv.EsvPassageService;
import org.biblememory.security.JwtService;
import org.biblememory.esv.EsvPassageService.EsvResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = PassageController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class PassageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EsvPassageService esvPassageService;

    @MockBean
    private JwtService jwtService;

    @Test
    void getPassage_returns200WithTextAndReferenceWhenServiceSucceeds() throws Exception {
        when(esvPassageService.fetchPassage(eq("John 3:16"), eq(false)))
                .thenReturn(new EsvResult(true, "For God so loved the world...", "John 3:16", null));

        mockMvc.perform(get("/api/passages").param("q", "John 3:16"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("For God so loved the world..."))
                .andExpect(jsonPath("$.reference").value("John 3:16"));

        verify(esvPassageService).fetchPassage(eq("John 3:16"), eq(false));
    }

    @Test
    void getPassage_passesReaderParamToService() throws Exception {
        when(esvPassageService.fetchPassage(eq("Psalm 23"), eq(true)))
                .thenReturn(new EsvResult(true, "The Lord is my shepherd...", "Psalm 23", null));

        mockMvc.perform(get("/api/passages")
                        .param("q", "Psalm 23")
                        .param("reader", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reference").value("Psalm 23"));

        verify(esvPassageService).fetchPassage(eq("Psalm 23"), eq(true));
    }

    @Test
    void getPassage_returns400ValidationErrorWhenQBlank() throws Exception {
        mockMvc.perform(get("/api/passages").param("q", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("Query parameter 'q' is required"));
    }

    @Test
    void getPassage_returns400EsvErrorWhenServiceFails() throws Exception {
        when(esvPassageService.fetchPassage(eq("invalid"), eq(false)))
                .thenReturn(new EsvResult(false, null, null, "Invalid passage reference"));

        mockMvc.perform(get("/api/passages").param("q", "invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ESV_ERROR"))
                .andExpect(jsonPath("$.message").value("Invalid passage reference"));
    }
}
