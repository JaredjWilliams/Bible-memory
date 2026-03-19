package org.biblememory.esv;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EsvPassageServiceTest {

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
