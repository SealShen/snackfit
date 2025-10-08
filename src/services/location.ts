import * as Location from "expo-location";

export type EnvType = "office" | "home" | "gym" | "station" | "outdoor";

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    console.warn("Location permission denied");
    return null;
  }
  const loc = await Location.getCurrentPositionAsync({});
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

// 模擬環境判斷 (MVP 可先用人工 mapping)
export function detectEnvironment(lat: number, lng: number): EnvType {
  // 之後可依使用者自訂地點或 GeoFence 替換
  return "office";
}
