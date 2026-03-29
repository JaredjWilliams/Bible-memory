package org.biblememory.service;

import org.biblememory.model.Collection;
import org.biblememory.model.Profile;
import org.biblememory.repository.CollectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

    /**
     * All collection IDs in the subtree rooted at {@code collectionId}, including the root.
     * Empty if the collection does not exist or is not owned by {@code userId}.
     */
    @Transactional(readOnly = true)
    public Set<Long> getSubtreeCollectionIdsIncludingRoot(Long collectionId, Long userId) {
        Collection root = findByIdAndUserId(collectionId, userId);
        if (root == null) {
            return Set.of();
        }
        Long profileId = root.getProfile().getId();
        List<Collection> all = collectionRepository.findByProfile_IdOrderByCreatedAtAsc(profileId);
        Map<Long, List<Long>> childrenByParent = new HashMap<>();
        for (Collection c : all) {
            if (c.getParent() != null) {
                childrenByParent
                        .computeIfAbsent(c.getParent().getId(), k -> new ArrayList<>())
                        .add(c.getId());
            }
        }
        Set<Long> out = new HashSet<>();
        Deque<Long> dq = new ArrayDeque<>();
        dq.add(collectionId);
        while (!dq.isEmpty()) {
            Long id = dq.removeFirst();
            if (!out.add(id)) {
                continue;
            }
            for (Long childId : childrenByParent.getOrDefault(id, List.of())) {
                dq.add(childId);
            }
        }
        return out;
    }

    @Transactional
    public Collection create(Long profileId, Long userId, String name, Long parentCollectionId) {
        Profile profile = profileService.findByIdAndUserId(profileId, userId);
        if (profile == null) {
            return null;
        }
        Collection collection = new Collection();
        collection.setProfile(profile);
        collection.setName(name);
        if (parentCollectionId != null) {
            Collection parent = findByIdAndUserId(parentCollectionId, userId);
            if (parent == null) {
                return null;
            }
            if (!parent.getProfile().getId().equals(profileId)) {
                return null;
            }
            collection.setParent(parent);
        }
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
