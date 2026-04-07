package org.biblememory.esv;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EsvPassageServiceTest {

    @Test
    void collapseHorizontalWhitespaceKeepLineLeadingIndent_preservesLeadingSpaces() {
        String input = "    How lonely sits\n        the city\n    that was full";
        assertThat(EsvPassageService.collapseHorizontalWhitespaceKeepLineLeadingIndent(input))
                .isEqualTo("    How lonely sits\n        the city\n    that was full");
    }

    @Test
    void collapseHorizontalWhitespaceKeepLineLeadingIndent_collapsesInteriorRuns() {
        assertThat(EsvPassageService.collapseHorizontalWhitespaceKeepLineLeadingIndent("a    b  c"))
                .isEqualTo("a b c");
        assertThat(EsvPassageService.collapseHorizontalWhitespaceKeepLineLeadingIndent("    line   with   gaps"))
                .isEqualTo("    line with gaps");
    }

    @Test
    void collapseHorizontalWhitespaceKeepLineLeadingIndent_normalizesLineBreaks() {
        assertThat(EsvPassageService.collapseHorizontalWhitespaceKeepLineLeadingIndent("x\r\ny\rz"))
                .isEqualTo("x\ny\nz");
    }

    @Test
    void fetchPassage_returnsErrorWhenApiKeyMissing() {
        EsvPassageService service = new EsvPassageService("");
        EsvPassageService.EsvResult result = service.fetchPassage("John 3:16");
        assertThat(result.success()).isFalse();
        assertThat(result.error()).contains("API key");
    }

    @Test
    void fetchPassage_returnsErrorWhenQueryBlank() {
        EsvPassageService service = new EsvPassageService("test-key");
        EsvPassageService.EsvResult result = service.fetchPassage("");
        assertThat(result.success()).isFalse();
    }
}
