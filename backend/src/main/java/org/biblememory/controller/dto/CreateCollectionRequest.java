package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCollectionRequest(
        @NotNull(message = "Profile ID is required")
        Long profileId,
        @NotBlank(message = "Name is required")
        String name,
        Long parentCollectionId
) {}
