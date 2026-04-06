package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateReaderNoteRequest(@NotBlank String content) {}
