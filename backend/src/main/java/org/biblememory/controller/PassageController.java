package org.biblememory.controller;

import org.biblememory.esv.EsvPassageService;
import org.biblememory.esv.EsvPassageService.EsvResult;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passages")
public class PassageController {

    private final EsvPassageService esvService;

    public PassageController(EsvPassageService esvService) {
        this.esvService = esvService;
    }

    @GetMapping
    public ResponseEntity<?> getPassage(@RequestParam String q) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new org.biblememory.model.ApiError("VALIDATION_ERROR", "Query parameter 'q' is required"));
        }
        EsvResult result = esvService.fetchPassage(q);
        if (!result.success()) {
            return ResponseEntity.badRequest()
                    .body(new org.biblememory.model.ApiError("ESV_ERROR", result.error()));
        }
        return ResponseEntity.ok(new PassageResponse(result.text(), result.reference()));
    }

    public record PassageResponse(String text, String reference) {}
}
