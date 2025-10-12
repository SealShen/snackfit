/**
 * SnackFit minimal engine (managed Expo)
 * - 請保持此檔案邏輯純粹：定時 tick → 收集上下文 → 發出建議通知
 * - 會嘗試動態載入你已存在的 services/rules、services/location、services/notifications
 *   若缺少則使用內建 fallback（確保 MVP 可跑）
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

type EnvType = "office" | "home" | "gym" | "station" | "outdoor";
type Snack = {
  id: string; name: string; durationSec: number;
  intensity: "hard" | "medium" | "easy" | "recovery";
  allowedEnvs: EnvType[]; forbiddenEnvs: EnvType[]; howTo?: string;
};

const HOUR_ALLOW = { start: 9, end: 21 }; // MVP：可在設定頁改
let _cooldownMs = 60 * 60 * 1000; // 一小時冷卻（被忽略時會自動拉長）
let _lastFire = 0;

async function ensurePermissions() {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: s2 } = await Notifications.requestPermissionsAsync();
    if (s2 !== "granted") { console.warn("[snacks] 通知權限未授予"); return false; }
  }
  return true;
}

function isAllowedHour() {
  const h = new Date().getHours();
  return h >= HOUR_ALLOW.start && h < HOUR_ALLOW.end;
}

// 動態載入可用的 services；缺了就給 fallback
async function loadServices() {
  let rules: any = null, loc: any = null, noti: any = null;
  try { rules = await import("./rules"); } catch {}
  try { loc   = await import("./location"); } catch {}
  try { noti  = await import("./notifications"); } catch {}
  return { rules, loc, noti };
}

async function fallbackPickSnacks(env: EnvType | null): Promise<Snack[]> {
  const base: Snack[] = [
    { id:"jj", name:"開合跳", durationSec:60, intensity:"medium", allowedEnvs:["home","outdoor","gym","office"], forbiddenEnvs:["station"] },
    { id:"sq", name:"椅子深蹲", durationSec:60, intensity:"easy", allowedEnvs:["office","home"], forbiddenEnvs:[] },
    { id:"stair", name:"快走樓梯", durationSec:60, intensity:"hard", allowedEnvs:["office","station","gym","outdoor"], forbiddenEnvs:["home"] },
  ];
  return base.filter(s => !env || (s.allowedEnvs.includes(env) && !s.forbiddenEnvs.includes(env))).slice(0,3);
}

async function fallbackNotify(snacks: Snack[]) {
  const lines = snacks.map(s => `• ${s.name}（${Math.round(s.durationSec/60)} 分鐘）`).join("\n");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "該起身動一動！運動點心來一份 🍎",
      body: lines.length ? lines : "做 1 分鐘原地快走或椅子深蹲也很棒！",
      data: { kind: "snack", items: snacks },
    },
    trigger: null, // 立刻
  });
}

function dynamicCooldown(adjust: "done" | "ignored") {
  if (adjust === "done") _cooldownMs = Math.max(20*60*1000, _cooldownMs * 0.75);
  if (adjust === "ignored") _cooldownMs = Math.min(2*60*60*1000, _cooldownMs * 1.25);
}

export async function bootstrapSnacksEngine() {
  const ok = await ensurePermissions();
  if (!ok) return;

  // 簡單的通知處理：使用者按下「完成 / 稍後」
  Notifications.setNotificationCategoryAsync?.("snack", [
    { identifier: "DONE", buttonTitle: "已完成", options: { opensAppToForeground: false } },
    { identifier: "LATER", buttonTitle: "稍後", options: { opensAppToForeground: false } },
  ]).catch(()=>{});
  Notifications.addNotificationResponseReceivedListener((resp) => {
    const id = resp.actionIdentifier;
    if (id === "DONE") dynamicCooldown("done");
    if (id === "LATER") dynamicCooldown("ignored");
  });

  const { rules, loc, noti } = await loadServices();

  // 主循環：每 60 秒檢查一次
  const TICK = 60 * 1000;
  async function tick() {
    try {
      if (!isAllowedHour()) return;
      const now = Date.now();
      if (now - _lastFire < _cooldownMs) return;

      // 環境推斷
      let env: EnvType | null = null;
      try {
        if (loc?.getCurrentEnvironment) env = await loc.getCurrentEnvironment();
        else if (loc?.getCurrentEnv) env = await loc.getCurrentEnv();
      } catch { /* ignore */ }

      // 選擇點心
      let snacks: Snack[] = [];
      try {
        if (rules?.pickSnacks) {
          snacks = await rules.pickSnacks({ env, ignoreCount: 0, todayDoneCount: 0, pool: [] });
        } else {
          snacks = await fallbackPickSnacks(env);
        }
      } catch {
        snacks = await fallbackPickSnacks(env);
      }

      if (snacks.length) {
        if (noti?.notifySnacks) await noti.notifySnacks(snacks);
        else await fallbackNotify(snacks);
        _lastFire = now;
      }
    } catch (e) {
      console.warn("[snacks] tick error", e);
    }
  }

  // 立即嘗試一次，之後每 60 秒 tick
  tick();
  const id = setInterval(tick, TICK);
  // 若需要，可暴露一個停止方法：
  (globalThis as any).__SNACKS_STOP__ = () => clearInterval(id);
}
import { getPrefs, getPlaces } from "./storage";
import * as Location from "expo-location";

/** 讀取偏好與地點，產生目前環境上下文 */
export async function getSnacksContext() {
  const prefs = await getPrefs();
  const places = await getPlaces();

  // 時段檢查
  const now = new Date();
  const hm = now.toTimeString().slice(0,5);
  const inHourRange = prefs.allowedHours.some(hr => hm >= hr.start && hm <= hr.end);
  const isWorkday = now.getDay() >= 1 && now.getDay() <= 5;
  if (!inHourRange || (prefs.workdaysOnly && !isWorkday)) {
    return { allow:false, reason:"out_of_hours", prefs, env:null };
  }

  // 地點判定（前景定位）
  let env: string | null = null;
  try {
    const { coords } = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = coords;
    for (const p of places) {
      const d = Math.sqrt((latitude - p.lat)**2 + (longitude - p.lng)**2) * 111000; // 粗估距離(m)
      if (d <= p.radiusM) { env = p.env; break; }
    }
  } catch { env = null; }

  return { allow:true, prefs, env };
}
/** === SnackFit Context Gate (minimal-intrusive) ===
 * 將 expo-notifications 的 scheduleNotificationAsync 以情境守門包起來：
 * 1) 非允許時段 / 非工作日 → 直接略過此次排程
 * 2) 命中使用者自訂地點 → 可在此依 env 調整訊息（可選）
 * 注意：這段碼不改動你現有的排程邏輯，只在送出前多一道判斷。
 */
// 若同檔已宣告 getSnacksContext 可直接使用；若在其他檔，請調整 import 來源。
declare const getSnacksContext: () => Promise<{ allow:boolean; reason?:string; prefs:any; env:string|null }>;

const __origScheduleSnackfit = (Notifications as any).scheduleNotificationAsync?.bind(Notifications);
(Notifications as any).scheduleNotificationAsync = (async (request: any) => {
  try {
    if (typeof getSnacksContext === "function") {
      const ctx = await getSnacksContext();
      if (!ctx.allow) {
        // 以「跳過識別碼」回傳，避免打擾；engine 其餘流程不受影響
        return { identifier: "snackfit-skipped-" + Date.now() };
      }
      // （可選）依 env 調整內容：例如在辦公室給較隱蔽的動作名稱
      // if (ctx.env && request?.content?.body) {
      //   request.content.body = `[${ctx.env}] ` + request.content.body;
      // }
    }
  } catch (_) {
    // 若情境判斷失敗，保守起見照常排程
  }
  return await __origScheduleSnackfit(request);
}) as any;
/** === /SnackFit Context Gate === */
/** === SnackFit Content Composer (env-aware) ===
 * 在 Context Gate 之上再次包裝 scheduleNotificationAsync：
 *  - 讀取 ctx.env 後，呼叫 pickSnacks(env) 產生 1~3 個建議
 *  - 如呼叫端未指定 content.title/body，則自動填入建議內容
 */
import { pickSnacks } from "./rules";

const __origScheduleSnackfit_v2 = (Notifications as any).scheduleNotificationAsync?.bind(Notifications);
(Notifications as any).scheduleNotificationAsync = (async (request: any = {}) => {
  try {
    if (typeof getSnacksContext === "function") {
      const ctx = await getSnacksContext();
      if (!ctx.allow) return { identifier: "snackfit-skipped-" + Date.now() };

      // 只有當 content 未指定時，才自動帶入建議，避免覆蓋你手動指定的通知
      if (!request.content || (!request.content.title && !request.content.body)) {
        const picks = await pickSnacks((ctx.env as any) ?? null, 3);
        const lines = picks.map(p => `• ${p.name} · ${Math.max(1, Math.round((p.durationSec||60)/60))} 分`).join("\n");
        request.content = {
          title: "運動點心時間",
          body: lines.length ? lines : "起身動一動，來份 1–2 分鐘的運動點心！",
          ...(request.content || {})
        };
      }
    }
  } catch (_) { /* 若失敗則回退原行為 */ }
  return await __origScheduleSnackfit_v2(request);
}) as any;
/** === /SnackFit Content Composer === */
