package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateNoteRequest(
        @NotNull Long verseId,
        @NotBlank String content
) {}
