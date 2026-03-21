package org.biblememory.service;

import org.biblememory.controller.dto.VersePracticeStatsDto;
import org.biblememory.model.Verse;
import org.biblememory.model.VerseProgress;
import org.biblememory.repository.VerseProgressRepository;
import org.biblememory.repository.VerseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SM-2-style spaced repetition: I(1)=1d, I(2)=6d, I(n)=I(n-1)×EF.
 * Quality 0-5 from typing accuracy; q<3 resets repetition count.
 */
@Service
public class SpacedRepetitionService {

    private static final double INITIAL_EF = 2.5;
    private static final double MIN_EF = 1.3;
    /** Cap interval to prevent timestamp overflow (PostgreSQL range ~year 294276) */
    private static final long MAX_INTERVAL_DAYS = 3650; // ~10 years

    private final VerseProgressRepository progressRepository;
    private final VerseRepository verseRepository;

    public SpacedRepetitionService(VerseProgressRepository progressRepository, VerseRepository verseRepository) {
        this.progressRepository = progressRepository;
        this.verseRepository = verseRepository;
    }

    /**
     * Map typing accuracy (0-100) to quality 0-5.
     * 100%→5, 95-99%→4, 80-94%→3, 50-79%→2, &lt;50%→1, incomplete→0
     */
    public int accuracyToQuality(double accuracyPercent, boolean completed) {
        if (!completed) return 0;
        if (accuracyPercent >= 100) return 5;
        if (accuracyPercent >= 95) return 4;
        if (accuracyPercent >= 80) return 3;
        if (accuracyPercent >= 50) return 2;
        return 1;
    }

    @Transactional
    public void recordPractice(Long userId, List<Long> verseIds, double accuracyPercent, boolean completed, boolean incrementInterval, String practiceMode) {
        int q = accuracyToQuality(accuracyPercent, completed);
        boolean success = completed && accuracyPercent >= 90;
        for (Long verseId : verseIds) {
            VerseProgress p = progressRepository.findByVerseIdAndUserId(verseId, userId)
                    .orElseGet(() -> {
                        VerseProgress np = new VerseProgress();
                        np.setVerseId(verseId);
                        np.setUserId(userId);
                        np.setRepetitionCount(0);
                        np.setEasinessFactor(INITIAL_EF);
                        return np;
                    });
            Instant now = Instant.now();
            p.setLastPracticedAt(now);
            if (success && practiceMode != null && !practiceMode.isBlank()) {
                switch (practiceMode.toLowerCase()) {
                    case "full" -> p.setFullCount(p.getFullCount() + 1);
                    case "alternating" -> p.setAlternatingCount(p.getAlternatingCount() + 1);
                    case "blank" -> p.setBlankCount(p.getBlankCount() + 1);
                    default -> { /* ignore unknown mode */ }
                }
            }
            if (incrementInterval) {
                if (q < 3) {
                    p.setRepetitionCount(0);
                } else {
                    p.setRepetitionCount(p.getRepetitionCount() + 1);
                    double ef = p.getEasinessFactor();
                    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
                    if (ef < MIN_EF) ef = MIN_EF;
                    p.setEasinessFactor(ef);
                }
                long intervalDays = intervalDays(p.getRepetitionCount(), p.getEasinessFactor());
                p.setNextReviewAt(now.plusSeconds(intervalDays * 24 * 3600));
            } else {
                p.setNextReviewAt(now);
            }
            progressRepository.save(p);
        }
    }

    private long intervalDays(int n, double ef) {
        if (n <= 0) return 0;
        if (n == 1) return 1;
        if (n == 2) return 6;
        double prev = 6;
        for (int i = 3; i <= n; i++) {
            prev = prev * ef;
        }
        return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(prev)));
    }

    @Transactional(readOnly = true)
    public Map<Long, VersePracticeStatsDto> getPracticeStats(Long userId, List<Long> verseIds) {
        if (verseIds == null || verseIds.isEmpty()) {
            return Map.of();
        }
        List<VerseProgress> progressList = progressRepository.findByVerseIdInAndUserId(verseIds, userId);
        Map<Long, VersePracticeStatsDto> result = new HashMap<>();
        for (Long verseId : verseIds) {
            VersePracticeStatsDto stats = progressList.stream()
                    .filter(p -> p.getVerseId().equals(verseId))
                    .findFirst()
                    .map(p -> new VersePracticeStatsDto(p.getFullCount(), p.getAlternatingCount(), p.getBlankCount()))
                    .orElse(new VersePracticeStatsDto(0, 0, 0));
            result.put(verseId, stats);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Verse> getVersesDueForReview(Long userId) {
        List<VerseProgress> due = progressRepository.findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(userId, Instant.now());
        List<Verse> result = new ArrayList<>();
        for (VerseProgress p : due) {
            verseRepository.findById(p.getVerseId()).ifPresent(result::add);
        }
        return result;
    }
}
