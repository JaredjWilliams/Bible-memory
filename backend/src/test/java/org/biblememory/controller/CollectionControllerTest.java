package org.biblememory.controller;

import org.biblememory.model.Collection;
import org.biblememory.model.Profile;
import org.biblememory.security.JwtService;
import org.biblememory.security.WithUserId;
import org.biblememory.service.CollectionService;
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

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CollectionController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(org.biblememory.config.GlobalExceptionHandler.class)
@ActiveProfiles("test")
class CollectionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CollectionService collectionService;

    @MockBean
    private JwtService jwtService;

    private static Collection createCollection(Long id, Long profileId, String name) {
        return createCollection(id, profileId, name, null);
    }

    private static Collection createCollection(Long id, Long profileId, String name, Collection parent) {
        Profile profile = new Profile();
        profile.setId(profileId);
        profile.setUserId(1L);
        Collection c = new Collection();
        c.setId(id);
        c.setProfile(profile);
        c.setName(name);
        c.setCreatedAt(Instant.now());
        c.setParent(parent);
        return c;
    }

    @Test
    @WithUserId
    void list_returns200WithCollectionsWhenAuthenticated() throws Exception {
        Collection col = createCollection(1L, 1L, "My Collection");
        when(collectionService.findByProfileId(1L, 1L)).thenReturn(List.of(col));

        mockMvc.perform(get("/api/collections").param("profileId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("My Collection"))
                .andExpect(jsonPath("$[0].parentCollectionId").value(nullValue()));

        verify(collectionService).findByProfileId(1L, 1L);
    }

    @Test
    void list_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(get("/api/collections").param("profileId", "1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns201WhenAuthenticated() throws Exception {
        Collection col = createCollection(1L, 1L, "New Collection");
        when(collectionService.create(1L, 1L, "New Collection", null)).thenReturn(col);

        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":1,\"name\":\"New Collection\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Collection"))
                .andExpect(jsonPath("$.parentCollectionId").value(nullValue()));

        verify(collectionService).create(1L, 1L, "New Collection", null);
    }

    @Test
    void create_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":1,\"name\":\"Collection\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void create_returns404WhenProfileNotFound() throws Exception {
        when(collectionService.create(999L, 1L, "Collection", null)).thenReturn(null);

        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":999,\"name\":\"Collection\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void create_returns400WhenNameBlank() throws Exception {
        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":1,\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithUserId
    void create_returns201WithParentWhenNested() throws Exception {
        Collection parent = createCollection(5L, 1L, "Parent");
        Collection child = createCollection(2L, 1L, "Child", parent);
        when(collectionService.create(1L, 1L, "Child", 5L)).thenReturn(child);

        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":1,\"name\":\"Child\",\"parentCollectionId\":5}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.parentCollectionId").value(5));

        verify(collectionService).create(1L, 1L, "Child", 5L);
    }

    @Test
    @WithUserId
    void create_returns404WhenParentInvalid() throws Exception {
        when(collectionService.create(1L, 1L, "Child", 99L)).thenReturn(null);

        mockMvc.perform(post("/api/collections")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"profileId\":1,\"name\":\"Child\",\"parentCollectionId\":99}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithUserId
    void delete_returns204WhenCollectionExists() throws Exception {
        Collection col = createCollection(1L, 1L, "Collection");
        when(collectionService.findByIdAndUserId(1L, 1L)).thenReturn(col);

        mockMvc.perform(delete("/api/collections/1"))
                .andExpect(status().isNoContent());

        verify(collectionService).delete(1L, 1L);
    }

    @Test
    void delete_returns401WhenNotAuthenticated() throws Exception {
        mockMvc.perform(delete("/api/collections/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithUserId
    void delete_returns404WhenCollectionNotFound() throws Exception {
        when(collectionService.findByIdAndUserId(999L, 1L)).thenReturn(null);

        mockMvc.perform(delete("/api/collections/999"))
                .andExpect(status().isNotFound());
    }
}
