package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.DueVerseDto;
import org.biblememory.controller.dto.PracticeResultRequest;
import org.biblememory.model.Verse;
import org.biblememory.service.CollectionService;
import org.biblememory.service.SpacedRepetitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final SpacedRepetitionService spacedRepetitionService;
    private final CollectionService collectionService;

    public PracticeController(SpacedRepetitionService spacedRepetitionService,
                              CollectionService collectionService) {
        this.spacedRepetitionService = spacedRepetitionService;
        this.collectionService = collectionService;
    }

    @PostMapping("/result")
    public ResponseEntity<Void> recordResult(@Valid @RequestBody PracticeResultRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        spacedRepetitionService.recordPractice(
                userId,
                request.verseIds(),
                request.accuracy(),
                request.completed(),
                Boolean.TRUE.equals(request.incrementInterval())
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/due")
    public ResponseEntity<List<DueVerseDto>> getDueVerses(@RequestParam(required = false) Long collectionId) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        List<Verse> due = spacedRepetitionService.getVersesDueForReview(userId);
        final Set<Long> allowedCollectionIds;
        if (collectionId == null) {
            allowedCollectionIds = null;
        } else {
            allowedCollectionIds = collectionService.getSubtreeCollectionIdsIncludingRoot(collectionId, userId);
            if (allowedCollectionIds.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
        }
        List<DueVerseDto> dtos = due.stream()
                .filter(v -> allowedCollectionIds == null || allowedCollectionIds.contains(v.getCollection().getId()))
                .map(v -> new DueVerseDto(v.getId(), v.getCollection().getId(), v.getReference(), v.getText(), v.getOrderIndex(), v.getSource(), v.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
