package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateNoteRequest(@NotBlank String content) {}
