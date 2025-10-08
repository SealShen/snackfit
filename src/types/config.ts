export type EnvType = "office" | "home" | "gym" | "station" | "outdoor";
export type HourRange = { start: string; end: string }; // "09:30" ~ "18:30"

export type SnackPrefs = {
  frequencyMin: number;          // 建議間隔（分鐘）
  allowedHours: HourRange[];     // 可提醒時段（可多段）
  workdaysOnly: boolean;         // 僅週一~週五
};

export type Place = {
  id: string;
  label: string;                 // 家/公司/健身房..自訂名稱
  env: EnvType;
  lat: number; lng: number;
  radiusM: number;               // 進入圈內視為在此地點
};
