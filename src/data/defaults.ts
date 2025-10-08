import { SnackPrefs, Place } from "../types/config";

export const DEFAULT_PREFS: SnackPrefs = {
  frequencyMin: 90,
  allowedHours: [{ start: "09:30", end: "18:30" }],
  workdaysOnly: true,
};

export const SAMPLE_PLACES: Place[] = [
  { id: "home", label: "家", env: "home", lat: 0, lng: 0, radiusM: 150 },
  { id: "office", label: "公司", env: "office", lat: 0, lng: 0, radiusM: 150 },
];
