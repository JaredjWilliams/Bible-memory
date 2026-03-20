package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.CreateNoteRequest;
import org.biblememory.controller.dto.NoteDto;
import org.biblememory.controller.dto.UpdateNoteRequest;
import org.biblememory.model.Note;
import org.biblememory.service.NoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam Long verseId) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<NoteDto> dtos = noteService.findByVerseIdAndUserId(verseId, userId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateNoteRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Note note = noteService.create(request.verseId(), userId, request.content());
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(note));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody UpdateNoteRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Note note = noteService.update(id, userId, request.content());
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
        if (!noteService.delete(id, userId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    private NoteDto toDto(Note n) {
        return new NoteDto(n.getId(), n.getVerseId(), n.getContent(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
