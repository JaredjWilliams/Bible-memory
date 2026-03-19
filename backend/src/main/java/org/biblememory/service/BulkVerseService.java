package org.biblememory.service;

import org.biblememory.controller.dto.VerseDto;
import org.biblememory.esv.EsvPassageService;
import org.biblememory.esv.EsvPassageService.EsvResult;
import org.biblememory.exception.DuplicateVerseException;
import org.biblememory.model.Verse;
import org.biblememory.util.ReferenceRangeParser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BulkVerseService {

    private final VerseService verseService;
    private final EsvPassageService esvService;

    public BulkVerseService(VerseService verseService, EsvPassageService esvService) {
        this.verseService = verseService;
        this.esvService = esvService;
    }

    /**
     * Bulk add verses from a reference range (e.g. "John 3:16-21").
     * Fetches each verse from ESV and adds to collection. Skips duplicates.
     */
    public BulkResult bulkAdd(Long collectionId, Long userId, String range) {
        List<String> refs = ReferenceRangeParser.parse(range);
        if (refs.isEmpty()) {
            return new BulkResult(List.of(), 0, "Invalid reference range. Use format like John 3:16-21 or John 3:16 - John 3:21");
        }

        List<VerseDto> added = new ArrayList<>();
        int skipped = 0;

        for (String ref : refs) {
            EsvResult result = esvService.fetchPassage(ref);
            if (!result.success()) {
                return new BulkResult(added, skipped, "Failed to fetch " + ref + ": " + result.error());
            }
            try {
                Verse verse = verseService.create(collectionId, userId, ref, result.text(), "ESV");
                if (verse != null) {
                    added.add(toDto(verse));
                }
            } catch (DuplicateVerseException e) {
                skipped++;
            }
        }

        return new BulkResult(added, skipped, null);
    }

    private VerseDto toDto(Verse v) {
        return new VerseDto(v.getId(), v.getReference(), v.getText(), v.getOrderIndex(), v.getSource(), v.getCreatedAt());
    }

    public record BulkResult(List<VerseDto> added, int skipped, String error) {}
}
