package org.biblememory.controller.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PracticeResultRequest(
        @NotEmpty(message = "Verse IDs required")
        List<Long> verseIds,

        @NotNull(message = "Accuracy required")
        @DecimalMin("0") @DecimalMax("100")
        Double accuracy,

        @NotNull(message = "Completed flag required")
        Boolean completed,

        /** When true, advance spaced-repetition interval. Only set when verse completed in blank mode on first try. Null/false = do not advance. */
        Boolean incrementInterval,

        /** "full" | "alternating" | "blank" - which mode was used. Used for per-mode practice counting. */
        String practiceMode
) {}
