import { Injectable, signal, computed } from '@angular/core';
import { Profile } from './profile.service';

const ACTIVE_PROFILE_KEY = 'bible_memory_active_profile';

@Injectable({ providedIn: 'root' })
export class ActiveProfileService {
  private profileSignal = signal<Profile | null>(this.loadStored());

  activeProfile = this.profileSignal.asReadonly();
  hasActiveProfile = computed(() => !!this.profileSignal());

  setActive(profile: Profile | null): void {
    this.profileSignal.set(profile);
    if (profile) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }

  private loadStored(): Profile | null {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  }
}
