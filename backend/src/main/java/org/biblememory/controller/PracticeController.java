package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.DueVerseDto;
import org.biblememory.controller.dto.PracticeResultRequest;
import org.biblememory.controller.dto.VersePracticeStatsDto;
import org.biblememory.model.Verse;
import org.biblememory.service.SpacedRepetitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final SpacedRepetitionService spacedRepetitionService;

    public PracticeController(SpacedRepetitionService spacedRepetitionService) {
        this.spacedRepetitionService = spacedRepetitionService;
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
                Boolean.TRUE.equals(request.incrementInterval()),
                request.practiceMode()
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<Long, VersePracticeStatsDto>> getStats(@RequestParam(required = false) List<Long> verseIds) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        List<Long> ids = verseIds != null ? verseIds : List.of();
        Map<Long, VersePracticeStatsDto> stats = spacedRepetitionService.getPracticeStats(userId, ids);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/due")
    public ResponseEntity<List<DueVerseDto>> getDueVerses(@RequestParam(required = false) Long collectionId) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        List<Verse> due = spacedRepetitionService.getVersesDueForReview(userId);
        List<DueVerseDto> dtos = due.stream()
                .filter(v -> collectionId == null || v.getCollection().getId().equals(collectionId))
                .map(v -> new DueVerseDto(v.getId(), v.getCollection().getId(), v.getReference(), v.getText(), v.getOrderIndex(), v.getSource(), v.getCreatedAt()))
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
