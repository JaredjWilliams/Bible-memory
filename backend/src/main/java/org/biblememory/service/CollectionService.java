package org.biblememory.service;

import org.biblememory.model.Collection;
import org.biblememory.model.Profile;
import org.biblememory.repository.CollectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final ProfileService profileService;

    public CollectionService(CollectionRepository collectionRepository, ProfileService profileService) {
        this.collectionRepository = collectionRepository;
        this.profileService = profileService;
    }

    @Transactional(readOnly = true)
    public List<Collection> findByProfileId(Long profileId, Long userId) {
        if (!profileService.existsByIdAndUserId(profileId, userId)) {
            return List.of();
        }
        return collectionRepository.findByProfile_IdOrderByCreatedAtAsc(profileId);
    }

    @Transactional(readOnly = true)
    public Collection findByIdAndUserId(Long id, Long userId) {
        return collectionRepository.findById(id)
                .filter(c -> c.getProfile().getUserId().equals(userId))
                .orElse(null);
    }

    @Transactional
    public Collection create(Long profileId, Long userId, String name) {
        Profile profile = profileService.findByIdAndUserId(profileId, userId);
        if (profile == null) {
            return null;
        }
        Collection collection = new Collection();
        collection.setProfile(profile);
        collection.setName(name);
        return collectionRepository.save(collection);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Collection collection = findByIdAndUserId(id, userId);
        if (collection != null) {
            collectionRepository.delete(collection);
        }
    }

    public boolean existsByIdAndUserId(Long id, Long userId) {
        return collectionRepository.existsByIdAndProfile_UserId(id, userId);
    }
}
