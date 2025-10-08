import AsyncStorage from "@react-native-async-storage/async-storage";
import { SnackPrefs, Place } from "../types/config";
import { DEFAULT_PREFS } from "../data/defaults";

const K_PREFS = "@snackfit.prefs";
const K_PLACES = "@snackfit.places";

export async function getPrefs(): Promise<SnackPrefs> {
  const raw = await AsyncStorage.getItem(K_PREFS);
  if (!raw) return DEFAULT_PREFS;
  try { return JSON.parse(raw) as SnackPrefs; } catch { return DEFAULT_PREFS; }
}

export async function setPrefs(p: SnackPrefs) {
  await AsyncStorage.setItem(K_PREFS, JSON.stringify(p));
}

export async function getPlaces(): Promise<Place[]> {
  const raw = await AsyncStorage.getItem(K_PLACES);
  if (!raw) return [];
  try { return JSON.parse(raw) as Place[]; } catch { return []; }
}

export async function setPlaces(list: Place[]) {
  await AsyncStorage.setItem(K_PLACES, JSON.stringify(list));
}
