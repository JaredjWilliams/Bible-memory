package org.biblememory.controller.dto;

import java.time.Instant;

public record VerseDto(Long id, String reference, String text, int orderIndex, String source, Instant createdAt) {}
