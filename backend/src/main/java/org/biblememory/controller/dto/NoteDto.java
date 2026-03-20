package org.biblememory.controller.dto;

import java.time.Instant;

public record NoteDto(Long id, Long verseId, String content, Instant createdAt, Instant updatedAt) {}
