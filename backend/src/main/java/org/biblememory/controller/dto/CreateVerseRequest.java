package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateVerseRequest(
        @NotNull(message = "Collection ID is required")
        Long collectionId,
        @NotBlank(message = "Reference is required")
        String reference,
        @NotBlank(message = "Text is required")
        String text,
        String source
) {}
