package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.CreateReaderNoteRequest;
import org.biblememory.controller.dto.ReaderNoteDto;
import org.biblememory.controller.dto.UpdateReaderNoteRequest;
import org.biblememory.model.ReaderNote;
import org.biblememory.service.ReaderNoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reader-notes")
public class ReaderNoteController {

    private final ReaderNoteService readerNoteService;

    public ReaderNoteController(ReaderNoteService readerNoteService) {
        this.readerNoteService = readerNoteService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam String book, @RequestParam int chapter) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ReaderNoteDto> dtos = readerNoteService.findByChapter(userId, book, chapter).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateReaderNoteRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReaderNote note = readerNoteService.create(
                userId, request.book(), request.chapter(), request.verseRange(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdateReaderNoteRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReaderNote note = readerNoteService.update(id, userId, request.content());
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toDto(note));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!readerNoteService.delete(id, userId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    private ReaderNoteDto toDto(ReaderNote n) {
        return new ReaderNoteDto(
                n.getId(), n.getBook(), n.getChapter(), n.getVerseRange(),
                n.getContent(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
