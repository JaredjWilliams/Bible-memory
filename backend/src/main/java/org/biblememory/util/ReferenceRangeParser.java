package org.biblememory.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses Bible reference ranges like "John 3:16-21" or "John 3:16 - John 3:21"
 * into individual verse references (same chapter only).
 */
public final class ReferenceRangeParser {

    // "Book Chapter:StartVerse-EndVerse" e.g. "John 3:16-21" or "1 John 3:16-21"
    private static final Pattern RANGE_SAME_LINE = Pattern.compile(
            "(.+?)\\s+(\\d+):(\\d+)-(\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    // "Book Chapter:Verse" for parsing individual refs
    private static final Pattern SINGLE_REF = Pattern.compile(
            "(.+?)\\s+(\\d+):(\\d+)",
            Pattern.CASE_INSENSITIVE
    );

    private ReferenceRangeParser() {}

    /**
     * Parse a reference range into individual verse references.
     * Supports: "John 3:16-21", "John 3:16 - John 3:21", "John 3:16 - 3:21"
     * Returns empty list if parsing fails.
     */
    public static List<String> parse(String input) {
        if (input == null || input.isBlank()) {
            return List.of();
        }
        String s = input.trim();

        // Format: "Book Chapter:StartVerse-EndVerse"
        Matcher m = RANGE_SAME_LINE.matcher(s);
        if (m.matches()) {
            String book = m.group(1).trim();
            int chapter = Integer.parseInt(m.group(2));
            int startVerse = Integer.parseInt(m.group(3));
            int endVerse = Integer.parseInt(m.group(4));
            if (startVerse <= endVerse && startVerse >= 1 && endVerse >= 1) {
                return buildRefs(book, chapter, startVerse, endVerse);
            }
        }

        // Format: "StartRef - EndRef" (with or without " - ")
        int dashIdx = s.indexOf(" - ");
        if (dashIdx < 0) {
            dashIdx = s.indexOf('-');
        }
        if (dashIdx > 0) {
            String startPart = s.substring(0, dashIdx).trim();
            String endPart = s.substring(dashIdx + (s.indexOf(" - ") >= 0 ? 3 : 1)).trim();
            Matcher startMatcher = SINGLE_REF.matcher(startPart);
            if (startMatcher.matches()) {
                String book = startMatcher.group(1).trim();
                int startChapter = Integer.parseInt(startMatcher.group(2));
                int startVerse = Integer.parseInt(startMatcher.group(3));

                int endChapter;
                int endVerse;
                Matcher endMatcher = SINGLE_REF.matcher(endPart);
                if (endMatcher.matches()) {
                    String endBook = endMatcher.group(1).trim();
                    endChapter = Integer.parseInt(endMatcher.group(2));
                    endVerse = Integer.parseInt(endMatcher.group(3));
                    if (!book.equalsIgnoreCase(endBook)) {
                        return List.of();
                    }
                } else {
                    Matcher shortEnd = Pattern.compile("(\\d+):(\\d+)").matcher(endPart);
                    if (shortEnd.matches()) {
                        endChapter = Integer.parseInt(shortEnd.group(1));
                        endVerse = Integer.parseInt(shortEnd.group(2));
                    } else {
                        return List.of();
                    }
                }
                if (startChapter != endChapter) {
                    return List.of();
                }
                if (startVerse <= endVerse && startVerse >= 1 && endVerse >= 1) {
                    return buildRefs(book, startChapter, startVerse, endVerse);
                }
            }
        }

        return List.of();
    }

    private static List<String> buildRefs(String book, int chapter, int startVerse, int endVerse) {
        List<String> refs = new ArrayList<>();
        for (int v = startVerse; v <= endVerse; v++) {
            refs.add(book + " " + chapter + ":" + v);
        }
        return refs;
    }
}
