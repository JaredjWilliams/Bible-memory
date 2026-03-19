package org.biblememory.service;

import org.biblememory.model.Profile;
import org.biblememory.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public List<Profile> findByUserId(Long userId) {
        return profileRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    @Transactional(readOnly = true)
    public Profile findByIdAndUserId(Long id, Long userId) {
        return profileRepository.findById(id)
                .filter(p -> p.getUserId().equals(userId))
                .orElse(null);
    }

    @Transactional
    public Profile create(Long userId, String name) {
        Profile profile = new Profile();
        profile.setUserId(userId);
        profile.setName(name);
        return profileRepository.save(profile);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Profile profile = findByIdAndUserId(id, userId);
        if (profile != null) {
            profileRepository.delete(profile);
        }
    }

    public boolean existsByIdAndUserId(Long id, Long userId) {
        return profileRepository.existsByIdAndUserId(id, userId);
    }
}
