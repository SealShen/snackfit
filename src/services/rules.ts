import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EnvType } from "../types/config";

/** CustomExerciseModal 既有儲存鍵 */
const K_CUSTOM = "@snackfit.customExercises";

/** 內建備援動作池（當沒有自訂時使用） */
const FALLBACK: Array<{ name:string; durationSec:number; intensity:"hard"|"medium"|"easy"|"recovery"; allowedEnvs:EnvType[]; forbiddenEnvs:EnvType[] }> = [
  { name:"椅子深蹲 x15", durationSec:60, intensity:"easy",    allowedEnvs:["office","home"], forbiddenEnvs:["station"] },
  { name:"開合跳 60秒",  durationSec:60, intensity:"medium",  allowedEnvs:["home","outdoor","gym"], forbiddenEnvs:["office","station"] },
  { name:"原地快走 2分鐘",durationSec:120,intensity:"easy",   allowedEnvs:["office","home","station","outdoor"], forbiddenEnvs:[] },
  { name:"樓梯快走 1層",  durationSec:90, intensity:"medium", allowedEnvs:["office","station","outdoor"], forbiddenEnvs:["home"] },
  { name:"伏地挺身 x10",  durationSec:60, intensity:"medium", allowedEnvs:["home","gym","outdoor"], forbiddenEnvs:["office","station"] },
  { name:"靠牆深蹲 45秒", durationSec:60, intensity:"easy",   allowedEnvs:["office","home","station"], forbiddenEnvs:[] }
];

/** 隨機取樣（避免每次都同一個） */
function sample<T>(arr:T[], k:number): T[] {
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0, Math.max(0, Math.min(k, a.length)));
}

/** 依 env 過濾符合 allowed/forbidden 的動作，回傳 1~3 個建議 */
export async function pickSnacks(env: EnvType | null, max = 3): Promise<Array<{name:string; durationSec:number}>> {
  let pool: any[] = [];
  try {
    const raw = await AsyncStorage.getItem(K_CUSTOM);
    if (raw) {
      const list = JSON.parse(raw);
      // 期望結構：{ name, intensity, allowedEnvs, forbiddenEnvs }
      pool = Array.isArray(list) ? list : [];
    }
  } catch {}

  if (!pool.length) pool = FALLBACK;

  const filtered = pool.filter((it:any) => {
    const allowed: EnvType[] = it.allowedEnvs ?? [];
    const forbidden: EnvType[] = it.forbiddenEnvs ?? [];
    if (!env) return true; // 無法判斷環境時給一般建議
    if (forbidden.includes(env)) return false;
    return allowed.length ? allowed.includes(env) : true;
  });

  const picks = sample(filtered, max).map(it => ({
    name: String(it.name ?? "運動點心"),
    durationSec: Number(it.durationSec ?? 60),
  }));

  return picks;
}
