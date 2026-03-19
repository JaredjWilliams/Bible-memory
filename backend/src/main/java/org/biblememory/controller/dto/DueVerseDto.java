package org.biblememory.controller.dto;

import java.time.Instant;

public record DueVerseDto(Long id, Long collectionId, String reference, String text, int orderIndex, String source, Instant createdAt) {}
