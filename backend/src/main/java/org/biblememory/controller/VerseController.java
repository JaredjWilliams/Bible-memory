package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.BulkAddVersesRequest;
import org.biblememory.controller.dto.BulkAddVersesResponse;
import org.biblememory.controller.dto.CreateVerseRequest;
import org.biblememory.controller.dto.UpdateVerseRequest;
import org.biblememory.controller.dto.VerseDto;
import org.biblememory.model.Verse;
import org.biblememory.service.BulkVerseService;
import org.biblememory.service.VerseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/verses")
public class VerseController {

    private final VerseService verseService;
    private final BulkVerseService bulkVerseService;

    public VerseController(VerseService verseService, BulkVerseService bulkVerseService) {
        this.verseService = verseService;
        this.bulkVerseService = bulkVerseService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam Long collectionId) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<VerseDto> dtos = verseService.findByCollectionId(collectionId, userId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> bulkCreate(@Valid @RequestBody BulkAddVersesRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        var result = bulkVerseService.bulkAdd(request.collectionId(), userId, request.range().trim());
        if (result.error() != null) {
            return ResponseEntity.badRequest()
                    .body(new org.biblememory.model.ApiError("BULK_ADD_ERROR", result.error()));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new BulkAddVersesResponse(result.added(), result.skipped()));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateVerseRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Verse verse = verseService.create(
                request.collectionId(), userId,
                request.reference(), request.text(),
                request.source());
        if (verse == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(verse));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody UpdateVerseRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Verse verse = verseService.update(id, userId,
                request.reference(), request.text(), request.orderIndex());
        if (verse == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toDto(verse));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Verse verse = verseService.findByIdAndUserId(id, userId);
        if (verse == null) {
            return ResponseEntity.notFound().build();
        }
        verseService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private VerseDto toDto(Verse v) {
        return new VerseDto(v.getId(), v.getReference(), v.getText(), v.getOrderIndex(), v.getSource(), v.getCreatedAt());
    }
}
