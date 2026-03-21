package org.biblememory.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "verse_progress", uniqueConstraints = @UniqueConstraint(columnNames = {"verse_id", "user_id"}))
public class VerseProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "verse_id")
    private Long verseId;

    @Column(nullable = false, name = "user_id")
    private Long userId;

    @Column(name = "last_practiced_at")
    private Instant lastPracticedAt;

    @Column(name = "next_review_at")
    private Instant nextReviewAt;

    @Column(name = "repetition_count")
    private int repetitionCount;

    @Column(name = "easiness_factor")
    private double easinessFactor;

    @Column(name = "full_count", nullable = false, columnDefinition = "integer default 0")
    private int fullCount = 0;

    @Column(name = "alternating_count", nullable = false, columnDefinition = "integer default 0")
    private int alternatingCount = 0;

    @Column(name = "blank_count", nullable = false, columnDefinition = "integer default 0")
    private int blankCount = 0;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getVerseId() {
        return verseId;
    }

    public void setVerseId(Long verseId) {
        this.verseId = verseId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Instant getLastPracticedAt() {
        return lastPracticedAt;
    }

    public void setLastPracticedAt(Instant lastPracticedAt) {
        this.lastPracticedAt = lastPracticedAt;
    }

    public Instant getNextReviewAt() {
        return nextReviewAt;
    }

    public void setNextReviewAt(Instant nextReviewAt) {
        this.nextReviewAt = nextReviewAt;
    }

    public int getRepetitionCount() {
        return repetitionCount;
    }

    public void setRepetitionCount(int repetitionCount) {
        this.repetitionCount = repetitionCount;
    }

    public double getEasinessFactor() {
        return easinessFactor;
    }

    public void setEasinessFactor(double easinessFactor) {
        this.easinessFactor = easinessFactor;
    }

    public int getFullCount() {
        return fullCount;
    }

    public void setFullCount(int fullCount) {
        this.fullCount = fullCount;
    }

    public int getAlternatingCount() {
        return alternatingCount;
    }

    public void setAlternatingCount(int alternatingCount) {
        this.alternatingCount = alternatingCount;
    }

    public int getBlankCount() {
        return blankCount;
    }

    public void setBlankCount(int blankCount) {
        this.blankCount = blankCount;
    }
}
