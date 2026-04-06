package org.biblememory.controller.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateReaderNoteRequest(
        @NotBlank String book,
        @NotNull @Min(1) Integer chapter,
        @NotBlank String verseRange,
        @NotBlank String content
) {}
