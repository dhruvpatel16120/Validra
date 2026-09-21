/**
 * Profile service for authenticated inspector/admin account profile and compliance statistics.
 */

import { apiClient } from "./api";
import type { ProfileResponse } from "@/types/auth";

export const PROFILE_ENDPOINTS = {
  ME: "/api/profile",
} as const;

export interface UpdateProfilePayload {
  full_name?: string;
  badge_number?: string;
  jurisdiction?: string;
}

class ProfileService {
  /**
   * Fetch authenticated user's profile and live compliance metrics.
   */
  async getProfile(): Promise<ProfileResponse> {
    return apiClient.get<ProfileResponse>(PROFILE_ENDPOINTS.ME);
  }

  /**
   * Update profile details (full name, badge number, jurisdiction).
   */
  async updateProfile(data: UpdateProfilePayload | string): Promise<ProfileResponse> {
    const payload = typeof data === "string" ? { full_name: data } : data;
    return apiClient.patch<ProfileResponse>(PROFILE_ENDPOINTS.ME, payload);
  }
}

export const profileService = new ProfileService();
