package org.biblememory.controller.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateProfileRequest(@NotBlank(message = "Name is required") String name) {}
