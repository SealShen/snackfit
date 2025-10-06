import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DarkTheme as T } from "../theme/dark";

type Preset = {
  name?: string;
  intensity?: "hard" | "medium" | "easy" | "recovery";
  allowedEnvs?: string[];
  forbiddenEnvs?: string[];
} | null;

export default function CustomExerciseModal({
  visible,
  onClose,
  onSave,
  preset
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (item: {
    id: string;
    name: string;
    custom: true;
    intensity: "hard" | "medium" | "easy" | "recovery";
    allowedEnvs: string[];
    forbiddenEnvs: string[];
  }) => void;
  preset?: Preset;
}) {
  const [name, setName] = useState("");
  const [intensity, setIntensity] = useState<"hard" | "medium" | "easy" | "recovery">("medium");
  const [allowed, setAllowed] = useState<string[]>(["office", "home"]);
  const [forbidden, setForbidden] = useState<string[]>(["station"]);

  useEffect(() => {
    if (preset) {
      setName(preset.name ?? "");
      setIntensity((preset.intensity as any) ?? "medium");
      setAllowed(preset.allowedEnvs ?? ["office", "home"]);
      setForbidden(preset.forbiddenEnvs ?? ["station"]);
    }
  }, [preset]);

  const ENVIRONMENTS = ["office", "home", "gym", "station"] as const;
  const INTENSITIES = ["hard", "medium", "easy", "recovery"] as const;

  const toggle = (list: string[], setList: (v: string[]) => void, val: string) =>
    setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" }}>
        <View style={{ padding: 16, backgroundColor: T.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Feather name="plus-circle" size={20} color={T.text} />
            <Text style={{ color: T.text, fontSize: 18, marginLeft: 8 }}>新增自定義項目</Text>
          </View>

          <Text style={{ color: T.muted, marginBottom: 6 }}>名稱</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="例如：彈力帶划船"
            placeholderTextColor={T.muted}
            style={{ color: T.text, borderWidth: 1, borderColor: T.hair, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: T.card }}
          />

          <Text style={{ color: T.muted, marginBottom: 6 }}>強度</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {INTENSITIES.map((lv) => (
              <TouchableOpacity
                key={lv}
                onPress={() => setIntensity(lv)}
                style={{
                  backgroundColor: intensity === lv ? T.primary : T.card,
                  paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 8
                }}
              >
                <Text style={{ color: intensity === lv ? "#16161A" : T.text }}>{lv}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ color: T.muted, marginBottom: 6 }}>適合環境</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
            {ENVIRONMENTS.map((env) => (
              <TouchableOpacity
                key={"allow-" + env}
                onPress={() => toggle(allowed, (v) => setAllowed(v), env)}
                style={{
                  backgroundColor: allowed.includes(env) ? T.accent : T.card,
                  paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, marginBottom: 8
                }}
              >
                <Text style={{ color: T.text }}>{env}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: T.muted, marginBottom: 6 }}>禁忌環境</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
            {ENVIRONMENTS.map((env) => (
              <TouchableOpacity
                key={"forbid-" + env}
                onPress={() => toggle(forbidden, (v) => setForbidden(v), env)}
                style={{
                  backgroundColor: forbidden.includes(env) ? T.danger : T.card,
                  paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, marginRight: 8, marginBottom: 8
                }}
              >
                <Text style={{ color: T.text }}>{env}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10, marginRight: 8 }}>
              <Text style={{ color: T.muted }}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!name.trim()) return;
                onSave({
                  id: "custom-" + Date.now(),
                  name,
                  custom: true,
                  intensity,
                  allowedEnvs: allowed,
                  forbiddenEnvs: forbidden
                });
              }}
              style={{ padding: 10, backgroundColor: T.primary, borderRadius: 8 }}
            >
              <Text style={{ color: "#16161A", fontWeight: "600" }}>儲存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}