package org.biblememory.controller.dto;

import java.time.Instant;

public record CollectionDto(Long id, String name, Instant createdAt) {}
