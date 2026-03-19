package org.biblememory.service;

import org.biblememory.exception.DuplicateVerseException;
import org.biblememory.model.Collection;
import org.biblememory.model.Verse;
import org.biblememory.repository.VerseProgressRepository;
import org.biblememory.repository.VerseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VerseService {

    private final VerseRepository verseRepository;
    private final VerseProgressRepository verseProgressRepository;
    private final CollectionService collectionService;

    public VerseService(VerseRepository verseRepository, VerseProgressRepository verseProgressRepository, CollectionService collectionService) {
        this.verseRepository = verseRepository;
        this.verseProgressRepository = verseProgressRepository;
        this.collectionService = collectionService;
    }

    @Transactional(readOnly = true)
    public List<Verse> findByCollectionId(Long collectionId, Long userId) {
        if (!collectionService.existsByIdAndUserId(collectionId, userId)) {
            return List.of();
        }
        return verseRepository.findByCollectionIdOrderByOrderIndexAsc(collectionId);
    }

    @Transactional(readOnly = true)
    public Verse findByIdAndUserId(Long id, Long userId) {
        return verseRepository.findById(id)
                .filter(v -> v.getCollection().getProfile().getUserId().equals(userId))
                .orElse(null);
    }

    @Transactional
    public Verse create(Long collectionId, Long userId, String reference, String text, String source) {
        Collection collection = collectionService.findByIdAndUserId(collectionId, userId);
        if (collection == null) {
            return null;
        }
        String ref = reference != null ? reference.trim() : "";
        if (verseRepository.existsByCollectionIdAndReference(collectionId, ref)) {
            throw new DuplicateVerseException("This verse is already in the collection");
        }
        int maxOrder = verseRepository.findByCollectionIdOrderByOrderIndexAsc(collectionId).stream()
                .mapToInt(Verse::getOrderIndex)
                .max()
                .orElse(-1);
        Verse verse = new Verse();
        verse.setCollection(collection);
        verse.setReference(ref);
        verse.setText(text);
        verse.setOrderIndex(maxOrder + 1);
        verse.setSource(source);
        return verseRepository.save(verse);
    }

    @Transactional
    public Verse update(Long id, Long userId, String reference, String text, Integer orderIndex) {
        Verse verse = findByIdAndUserId(id, userId);
        if (verse == null) {
            return null;
        }
        if (reference != null) verse.setReference(reference);
        if (text != null) verse.setText(text);
        if (orderIndex != null) verse.setOrderIndex(orderIndex);
        return verseRepository.save(verse);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Verse verse = findByIdAndUserId(id, userId);
        if (verse != null) {
            verseProgressRepository.deleteByVerseId(id);
            verseRepository.delete(verse);
        }
    }

    public boolean existsByIdAndUserId(Long id, Long userId) {
        return verseRepository.existsByIdAndCollection_Profile_UserId(id, userId);
    }
}
