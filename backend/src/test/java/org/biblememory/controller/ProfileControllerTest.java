package org.biblememory.controller;

import org.biblememory.model.Profile;
import org.biblememory.security.JwtService;
import org.biblememory.security.WithUserId;
import org.biblememory.service.ProfileService;
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

@WebMvcTest(controllers = ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProfileService profileService;

    @MockBean
    private JwtService jwtService;

    private static Profile createProfile(Long id, Long userId, String name) {
        Profile p = new Profile();
        p.setId(id);
        p.setUserId(userId);
        p.setName(name);
        p.setCreatedAt(Instant.now());
        return p;
    }

    @Test
    @WithUserId
    void list_returns200WithProfilesWhenAuthenticated() throws Exception {
        Profile profile = createProfile(1L, 1L, "My Profile");
        when(profileService.findByUserId(1L)).thenReturn(List.of(profile));

        mockMvc.perform(get("/api/profiles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("My Profile"));

        verify(profileService).findByUserId(1L);
    }

    @Test
    void list_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/profiles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns201WithCreatedProfileWhenAuthenticated() throws Exception {
        Profile profile = createProfile(1L, 1L, "New Profile");
        when(profileService.create(1L, "New Profile")).thenReturn(profile);

        mockMvc.perform(post("/api/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New Profile\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Profile"));

        verify(profileService).create(1L, "New Profile");
    }

    @Test
    void create_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Profile\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns400WhenNameBlank() throws Exception {
        mockMvc.perform(post("/api/profiles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void delete_returns204WhenProfileExists() throws Exception {
        Profile profile = createProfile(1L, 1L, "Profile");
        when(profileService.findByIdAndUserId(1L, 1L)).thenReturn(profile);

        mockMvc.perform(delete("/api/profiles/1"))
                .andExpect(status().isNoContent());

        verify(profileService).delete(1L, 1L);
    }

    @Test
    void delete_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/api/profiles/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void delete_returns404WhenProfileNotFound() throws Exception {
        when(profileService.findByIdAndUserId(999L, 1L)).thenReturn(null);

        mockMvc.perform(delete("/api/profiles/999"))
                .andExpect(status().isNotFound());
    }
}
