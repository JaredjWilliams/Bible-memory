package org.biblememory.controller.dto;

import java.time.Instant;

public record ReaderNoteDto(
        Long id,
        String book,
        int chapter,
        String verseRange,
        String content,
        Instant createdAt,
        Instant updatedAt
) {}
