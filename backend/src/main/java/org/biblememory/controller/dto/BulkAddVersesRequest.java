package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BulkAddVersesRequest(
        @NotNull(message = "Collection ID is required")
        Long collectionId,
        @NotBlank(message = "Reference range is required")
        String range
) {}
