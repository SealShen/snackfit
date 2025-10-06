// src/screens/Settings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme as T } from "../theme/dark";
import CustomExerciseModal from "../components/CustomExerciseModal";

export default function SettingsScreen() {
  const [customs, setCustoms] = useState<any[]>([]);
  const [modal, setModal] = useState(false);

  // 初始載入自定義運動
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("@snackfit.customExercises");
      if (raw) setCustoms(JSON.parse(raw));
    })();
  }, []);

  const onSave = async (item: any) => {
    const list = [...customs, item];
    setCustoms(list);
    await AsyncStorage.setItem("@snackfit.customExercises", JSON.stringify(list));
    setModal(false);
  };

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: T.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={customs}
      keyExtractor={(it) => it.id}
      ListHeaderComponent={
        <View>
          {/* 通知與提醒 */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="bell" size={18} color={T.text} />
              <Text style={{ color: T.text, fontSize: 16, marginLeft: 8 }}>通知與提醒</Text>
            </View>
            <View style={{ backgroundColor: T.surface, padding: 12, borderRadius: 10 }}>
              <Text style={{ color: T.muted }}>久坐通知：開/關</Text>
              <Text style={{ color: T.muted, marginTop: 4 }}>持續時間設定：30/45/60 分鐘</Text>
              <Text style={{ color: T.muted, marginTop: 4 }}>安靜時段：開/關＋時間範圍</Text>
            </View>
          </View>

          {/* 目標設定 */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="target" size={18} color={T.text} />
              <Text style={{ color: T.text, fontSize: 16, marginLeft: 8 }}>目標設定</Text>
            </View>
            <View style={{ backgroundColor: T.surface, padding: 12, borderRadius: 10 }}>
              <Text style={{ color: T.muted }}>每週 VEM 目標：150 / 225 / 300 或自訂</Text>
            </View>
          </View>

          {/* 健康資料整合 */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="heart" size={18} color={T.text} />
              <Text style={{ color: T.text, fontSize: 16, marginLeft: 8 }}>健康資料整合</Text>
            </View>
            <View style={{ backgroundColor: T.surface, padding: 12, borderRadius: 10 }}>
              <Text style={{ color: T.muted }}>HRV/心率整合：開/關</Text>
              <Text style={{ color: T.muted, marginTop: 4 }}>HRV 基線校準（需 7 天）</Text>
              <Text style={{ color: T.muted, marginTop: 4 }}>自動強度建議：開/關</Text>
            </View>
          </View>

          {/* 地點管理 */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="map-pin" size={18} color={T.text} />
              <Text style={{ color: T.text, fontSize: 16, marginLeft: 8 }}>地點管理</Text>
            </View>
            <View style={{ backgroundColor: T.surface, padding: 12, borderRadius: 10 }}>
              <Text style={{ color: T.muted }}>新增 / 編輯 / 刪除常用地點</Text>
            </View>
          </View>

          {/* 自定義運動項目（新增按鈕） */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Feather name="plus-circle" size={18} color={T.text} />
              <Text style={{ color: T.text, fontSize: 16, marginLeft: 8 }}>自定義運動項目</Text>
            </View>
            <TouchableOpacity
              onPress={() => setModal(true)}
              style={{ backgroundColor: T.card, padding: 12, borderRadius: 10, flexDirection: "row", alignItems: "center" }}
            >
              <Feather name="plus" size={18} color={T.primary} />
              <Text style={{ color: T.primary, marginLeft: 6 }}>新增一個自定義項目</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ backgroundColor: T.surface, padding: 12, borderRadius: 10, marginBottom: 8 }}>
          <Text style={{ color: T.text, fontWeight: "600" }}>{item.name}</Text>
          <Text style={{ color: T.muted, marginTop: 4 }}>
            強度：{item.intensity}｜適合：{item.allowedEnvs?.join(", ")}｜禁忌：{item.forbiddenEnvs?.join(", ")}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={{ color: T.muted, textAlign: "center", marginTop: 20 }}>尚未新增任何自定義項目</Text>
      }
    />
  );
}
