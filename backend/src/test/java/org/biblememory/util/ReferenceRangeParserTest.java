package org.biblememory.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReferenceRangeParserTest {

    @Test
    void parse_sameLineFormat_returnsVerseList() {
        List<String> result = ReferenceRangeParser.parse("John 3:16-21");
        assertEquals(List.of(
                "John 3:16", "John 3:17", "John 3:18", "John 3:19", "John 3:20", "John 3:21"
        ), result);
    }

    @Test
    void parse_fullEndRefFormat_returnsSameResult() {
        List<String> result = ReferenceRangeParser.parse("John 3:16 - John 3:21");
        assertEquals(List.of(
                "John 3:16", "John 3:17", "John 3:18", "John 3:19", "John 3:20", "John 3:21"
        ), result);
    }

    @Test
    void parse_shortEndFormat_returnsSameResult() {
        List<String> result = ReferenceRangeParser.parse("John 3:16 - 3:21");
        assertEquals(List.of(
                "John 3:16", "John 3:17", "John 3:18", "John 3:19", "John 3:20", "John 3:21"
        ), result);
    }

    @Test
    void parse_nullReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse(null).isEmpty());
    }

    @Test
    void parse_blankReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse("").isEmpty());
        assertTrue(ReferenceRangeParser.parse("   ").isEmpty());
    }

    @Test
    void parse_invalidFormatReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse("abc").isEmpty());
    }

    @Test
    void parse_reversedRangeReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse("John 3:21-16").isEmpty());
    }

    @Test
    void parse_differentBooksReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse("John 3:16 - Genesis 1:1").isEmpty());
    }

    @Test
    void parse_differentChaptersReturnsEmptyList() {
        assertTrue(ReferenceRangeParser.parse("John 3:16 - John 4:21").isEmpty());
    }

    @Test
    void parse_singleVerse() {
        List<String> result = ReferenceRangeParser.parse("Psalm 23:1-1");
        assertEquals(List.of("Psalm 23:1"), result);
    }

    @Test
    void parse_oneJohnBook() {
        List<String> result = ReferenceRangeParser.parse("1 John 2:1-3");
        assertEquals(List.of("1 John 2:1", "1 John 2:2", "1 John 2:3"), result);
    }
}
