package org.biblememory.esv;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EsvPassageService {

    private static final String ESV_BASE = "https://api.esv.org/v3/passage/text/";
    private static final int MAX_VERSES = 500;

    private final RestTemplate restTemplate = new RestTemplate();
    private final String apiKey;

    public EsvPassageService(@Value("${ESV_API_KEY:}") String apiKey) {
        this.apiKey = apiKey;
    }

    @Cacheable(value = "passages", key = "#query.trim().toLowerCase() + '|false'", condition = "#result != null && #result.success()")
    public EsvResult fetchPassage(String query) {
        return fetchPassage(query, false);
    }

    @Cacheable(value = "passages", key = "#query.trim().toLowerCase() + '|' + #readerMode", condition = "#result != null && #result.success()")
    public EsvResult fetchPassage(String query, boolean readerMode) {
        if (apiKey == null || apiKey.isBlank()) {
            return EsvResult.error("ESV API key not configured");
        }
        if (query == null || query.isBlank()) {
            return EsvResult.error("Query is required");
        }
        String encoded = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
        String url = ESV_BASE + "?q=" + encoded
                + "&include-passage-references=" + readerMode
                + "&include-verse-numbers=" + readerMode
                + "&include-footnotes=false"
                + "&include-footnote-body=false"
                + "&include-headings=" + readerMode
                + "&include-short-copyright=true";
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Token " + apiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<EsvResponse> response = restTemplate.exchange(
                    URI.create(url),
                    HttpMethod.GET,
                    entity,
                    EsvResponse.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String[] passages = response.getBody().passages();
                String raw = passages != null && passages.length > 0
                        ? String.join("\n", passages).trim()
                        : "";
                String text = sanitizePassageText(raw, readerMode);
                return EsvResult.success(text, query);
            }
            return EsvResult.error("Failed to fetch passage");
        } catch (Exception e) {
            return EsvResult.error(e.getMessage() != null ? e.getMessage() : "ESV API error");
        }
    }

    /**
     * Sanitize ESV passage text: remove verse numbers (unless reader mode), footnotes, headings, and extra formatting.
     */
    private String sanitizePassageText(String text, boolean readerMode) {
        if (text == null || text.isBlank()) return "";
        // Remove "Footnotes" section and everything after it
        int footnotesIdx = text.toLowerCase().indexOf("footnotes");
        if (footnotesIdx >= 0) {
            text = text.substring(0, footnotesIdx);
        }
        // Remove footnote references like (1), (2) in the text
        text = text.replaceAll("\\(\\d+\\)", "");
        // Remove verse numbers in brackets like [16], [35] (skip in reader mode to keep verse markers)
        // Use [ \t] to preserve newlines (paragraph breaks)
        if (!readerMode) {
            text = text.replaceAll("[ \\t]*\\[\\d+\\][ \\t]*", " ");
        }
        // Remove trailing (ESV) copyright
        text = text.replaceAll("\\s*\\(ESV\\)\\s*$", "");
        // Remove section headings (skip in reader mode to keep them embedded)
        if (!readerMode) {
            text = text.replaceAll("(?m)^[^\\[\"]+\\|\\s*\"?", "");
        }
        // Collapse multiple spaces/tabs but preserve newlines (paragraph breaks)
        text = text.replaceAll("[ \\t]+", " ").trim();
        return text;
    }

    public record EsvResponse(String[] passages) {}

    public record EsvResult(boolean success, String text, String reference, String error) {
        static EsvResult success(String text, String reference) {
            return new EsvResult(true, text, reference, null);
        }
        static EsvResult error(String message) {
            return new EsvResult(false, null, null, message);
        }
    }
}
