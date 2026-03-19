package org.biblememory.controller.dto;

import java.time.Instant;

public record ProfileDto(Long id, String name, Instant createdAt) {}
