package org.biblememory.service;

import org.biblememory.model.Collection;
import org.biblememory.model.Profile;
import org.biblememory.model.Verse;
import org.biblememory.model.VerseProgress;
import org.biblememory.repository.VerseProgressRepository;
import org.biblememory.repository.VerseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpacedRepetitionServiceTest {

    @Mock
    private VerseProgressRepository progressRepository;

    @Mock
    private VerseRepository verseRepository;

    @InjectMocks
    private SpacedRepetitionService spacedRepetitionService;

    @Test
    void accuracyToQuality_returns5For100Percent() {
        assertThat(spacedRepetitionService.accuracyToQuality(100, true)).isEqualTo(5);
    }

    @Test
    void accuracyToQuality_returns4For95To99Percent() {
        assertThat(spacedRepetitionService.accuracyToQuality(99, true)).isEqualTo(4);
        assertThat(spacedRepetitionService.accuracyToQuality(95, true)).isEqualTo(4);
    }

    @Test
    void accuracyToQuality_returns3For80To94Percent() {
        assertThat(spacedRepetitionService.accuracyToQuality(94, true)).isEqualTo(3);
        assertThat(spacedRepetitionService.accuracyToQuality(80, true)).isEqualTo(3);
    }

    @Test
    void accuracyToQuality_returns2For50To79Percent() {
        assertThat(spacedRepetitionService.accuracyToQuality(79, true)).isEqualTo(2);
        assertThat(spacedRepetitionService.accuracyToQuality(50, true)).isEqualTo(2);
    }

    @Test
    void accuracyToQuality_returns1ForUnder50Percent() {
        assertThat(spacedRepetitionService.accuracyToQuality(49, true)).isEqualTo(1);
        assertThat(spacedRepetitionService.accuracyToQuality(0, true)).isEqualTo(1);
    }

    @Test
    void accuracyToQuality_returns0WhenNotCompleted() {
        assertThat(spacedRepetitionService.accuracyToQuality(100, false)).isEqualTo(0);
        assertThat(spacedRepetitionService.accuracyToQuality(50, false)).isEqualTo(0);
    }

    @Test
    void recordPractice_incrementsRepetitionCountWhenQuality3OrAboveAndIncrementInterval() {
        VerseProgress existing = new VerseProgress();
        existing.setId(1L);
        existing.setVerseId(10L);
        existing.setUserId(1L);
        existing.setRepetitionCount(2);
        existing.setEasinessFactor(2.5);
        existing.setLastPracticedAt(Instant.now().minusSeconds(86400));
        existing.setNextReviewAt(Instant.now());

        when(progressRepository.findByVerseIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(progressRepository.save(any(VerseProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        spacedRepetitionService.recordPractice(1L, List.of(10L), 85.0, true, true);

        ArgumentCaptor<VerseProgress> captor = ArgumentCaptor.forClass(VerseProgress.class);
        verify(progressRepository).save(captor.capture());
        VerseProgress saved = captor.getValue();
        assertThat(saved.getRepetitionCount()).isEqualTo(3);
        assertThat(saved.getNextReviewAt()).isAfter(Instant.now());
    }

    @Test
    void recordPractice_resetsRepetitionCountWhenQualityBelow3AndIncrementInterval() {
        VerseProgress existing = new VerseProgress();
        existing.setId(1L);
        existing.setVerseId(10L);
        existing.setUserId(1L);
        existing.setRepetitionCount(5);
        existing.setEasinessFactor(2.5);

        when(progressRepository.findByVerseIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(progressRepository.save(any(VerseProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        spacedRepetitionService.recordPractice(1L, List.of(10L), 40.0, true, true);

        ArgumentCaptor<VerseProgress> captor = ArgumentCaptor.forClass(VerseProgress.class);
        verify(progressRepository).save(captor.capture());
        VerseProgress saved = captor.getValue();
        assertThat(saved.getRepetitionCount()).isEqualTo(0);
    }

    @Test
    void recordPractice_createsNewProgressWhenNoneExists() {
        when(progressRepository.findByVerseIdAndUserId(10L, 1L)).thenReturn(Optional.empty());
        when(progressRepository.save(any(VerseProgress.class))).thenAnswer(inv -> {
            VerseProgress p = inv.getArgument(0);
            p.setId(1L);
            return p;
        });

        spacedRepetitionService.recordPractice(1L, List.of(10L), 100.0, true, true);

        ArgumentCaptor<VerseProgress> captor = ArgumentCaptor.forClass(VerseProgress.class);
        verify(progressRepository).save(captor.capture());
        VerseProgress saved = captor.getValue();
        assertThat(saved.getVerseId()).isEqualTo(10L);
        assertThat(saved.getUserId()).isEqualTo(1L);
        assertThat(saved.getRepetitionCount()).isEqualTo(1);
    }

    @Test
    void recordPractice_setsNextReviewToNowWhenNotIncrementingInterval() {
        VerseProgress existing = new VerseProgress();
        existing.setVerseId(10L);
        existing.setUserId(1L);
        existing.setRepetitionCount(1);

        when(progressRepository.findByVerseIdAndUserId(10L, 1L)).thenReturn(Optional.of(existing));
        when(progressRepository.save(any(VerseProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        Instant before = Instant.now();
        spacedRepetitionService.recordPractice(1L, List.of(10L), 100.0, true, false);
        Instant after = Instant.now();

        ArgumentCaptor<VerseProgress> captor = ArgumentCaptor.forClass(VerseProgress.class);
        verify(progressRepository).save(captor.capture());
        assertThat(captor.getValue().getNextReviewAt()).isBetween(before, after);
    }

    @Test
    void getVersesDueForReview_returnsVersesWithNextReviewAtLessThanOrEqualNow() {
        VerseProgress p1 = new VerseProgress();
        p1.setVerseId(1L);
        p1.setUserId(1L);
        VerseProgress p2 = new VerseProgress();
        p2.setVerseId(2L);
        p2.setUserId(1L);

        Verse v1 = createVerse(1L);
        Verse v2 = createVerse(2L);

        when(progressRepository.findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(eq(1L), any(Instant.class)))
                .thenReturn(List.of(p1, p2));
        when(verseRepository.findById(1L)).thenReturn(Optional.of(v1));
        when(verseRepository.findById(2L)).thenReturn(Optional.of(v2));

        List<Verse> result = spacedRepetitionService.getVersesDueForReview(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(1).getId()).isEqualTo(2L);
    }

    @Test
    void getVersesDueForReview_skipsMissingVerses() {
        VerseProgress p1 = new VerseProgress();
        p1.setVerseId(1L);
        p1.setUserId(1L);

        when(progressRepository.findByUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(eq(1L), any(Instant.class)))
                .thenReturn(List.of(p1));
        when(verseRepository.findById(1L)).thenReturn(Optional.empty());

        List<Verse> result = spacedRepetitionService.getVersesDueForReview(1L);

        assertThat(result).isEmpty();
    }

    private Verse createVerse(Long id) {
        Profile profile = new Profile();
        profile.setId(1L);
        profile.setUserId(1L);
        Collection col = new Collection();
        col.setId(1L);
        col.setProfile(profile);
        Verse v = new Verse();
        v.setId(id);
        v.setCollection(col);
        v.setReference("John 3:16");
        v.setText("For God so loved the world");
        v.setOrderIndex(0);
        v.setCreatedAt(Instant.now());
        return v;
    }
}
