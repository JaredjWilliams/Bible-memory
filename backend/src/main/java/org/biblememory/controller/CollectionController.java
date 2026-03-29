package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.CollectionDto;
import org.biblememory.controller.dto.CreateCollectionRequest;
import org.biblememory.model.Collection;
import org.biblememory.service.CollectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam Long profileId) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<CollectionDto> dtos = collectionService.findByProfileId(profileId, userId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateCollectionRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Collection collection = collectionService.create(
                request.profileId(), userId, request.name(), request.parentCollectionId());
        if (collection == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(collection));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Collection collection = collectionService.findByIdAndUserId(id, userId);
        if (collection == null) {
            return ResponseEntity.notFound().build();
        }
        collectionService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private CollectionDto toDto(Collection c) {
        Long parentId = c.getParent() != null ? c.getParent().getId() : null;
        return new CollectionDto(c.getId(), c.getName(), c.getCreatedAt(), parentId);
    }
}
