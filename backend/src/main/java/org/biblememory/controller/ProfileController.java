package org.biblememory.controller;

import jakarta.validation.Valid;
import org.biblememory.controller.dto.CreateProfileRequest;
import org.biblememory.controller.dto.ProfileDto;
import org.biblememory.model.Profile;
import org.biblememory.service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<List<ProfileDto>> list() {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<ProfileDto> dtos = profileService.findByUserId(userId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateProfileRequest request) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Profile profile = profileService.create(userId, request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(profile));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = ControllerUtils.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Profile profile = profileService.findByIdAndUserId(id, userId);
        if (profile == null) {
            return ResponseEntity.notFound().build();
        }
        profileService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private ProfileDto toDto(Profile p) {
        return new ProfileDto(p.getId(), p.getName(), p.getCreatedAt());
    }
}
