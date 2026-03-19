package org.biblememory.controller.dto;

import java.util.List;

public record BulkAddVersesResponse(
        List<VerseDto> added,
        int skipped
) {}
