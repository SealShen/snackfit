// SnackcerciseDashboard.tsx
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Path, Line, Polygon, Rect } from "react-native-svg";

/** Helpers */
const toRad = (deg: number) => (Math.PI / 180) * deg;
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = toRad(deg - 90);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
) {
  const large = endAngle - startAngle > 180 ? 1 : 0;
  const start = polarToCartesian(cx, cy, rOuter, startAngle);
  const end = polarToCartesian(cx, cy, rOuter, endAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, endAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, startAngle);
  
  return `M ${start.x} ${start.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${end.x} ${end.y} L ${innerStart.x} ${innerStart.y} A ${rInner} ${rInner} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y} Z`;
}

/** Props */
export type SnackcerciseDashboardProps = {
  dayProgress?: number;
  weekProgress?: number;
  initialIntensity?: number;
  initialActionName?: string;
  actionPool?: string[];
  onSwap?: (nextAction: string) => void;
  onPlayToggle?: (playing: boolean) => void;
  onIntensityChange?: (val: number) => void;
  locations?: string[];
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Main */
const SnackcerciseDashboard: React.FC<SnackcerciseDashboardProps> = ({
  dayProgress = 0.6,
  weekProgress = 0.6,
  initialIntensity = 3,
  initialActionName = "深蹲",
  actionPool = ["伏地挺身", "弓箭步", "平板支撐", "開合跳"],
  onSwap,
  onPlayToggle,
  onIntensityChange,
  locations = ["家裡", "辦公室", "健身房", "車站"],
}) => {
  const [playing, setPlaying] = useState(false);
  const [intensity, setIntensity] = useState(clamp(initialIntensity, 1, 5));
  const [actionIdx, setActionIdx] = useState(0);
  const [size, setSize] = useState(360);
  const [activeLocation, setActiveLocation] = useState(0);

  const actionName = useMemo(() => {
    return actionIdx === 0 ? initialActionName : actionPool[(actionIdx - 1) % actionPool.length];
  }, [actionIdx, initialActionName, actionPool]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSize(Math.max(320, Math.min(440, w - 48)));
  }, []);

  // 幾何尺寸（相對於 viewBox 360）
  const vb = 360;
  const cx = 180;
  const cy = 180;
  const rOuter = 150;
  const rInner = 118;
  const r2 = 110; // 扇形外圈
  const r1 = 68;  // 扇形內圈
  const centerR = 65;

  // 四個扇形區域的角度
  const sectors = [
    { id: 'top', a0: -45, a1: 45, action: 'swap', icon: 'swap' },
    { id: 'right', a0: 45, a1: 135, action: 'plus', icon: 'plus' },
    { id: 'bottom', a0: 135, a1: 225, action: 'help', icon: 'help' },
    { id: 'left', a0: 225, a1: 315, action: 'minus', icon: 'minus' }
  ];

  // 分隔線角度
  const dividerAngles = [45, 135, 225, 315];

  // 進度弧長度
  const dayLen = 2 * Math.PI * rInner;
  const weekLen = 2 * Math.PI * rOuter;
  const dayDash = [dayLen * clamp(dayProgress, 0, 1), dayLen];
  const weekDash = [weekLen * clamp(weekProgress, 0, 1), weekLen];

  /** interactions */
  const handleToggle = () => {
    const val = !playing;
    setPlaying(val);
    onPlayToggle?.(val);
  };

  const handleSwap = () => {
    setActionIdx((n) => (n + 1) % (actionPool.length + 1));
    onSwap?.(actionName);
  };

  const handlePlus = () => {
    setIntensity((n) => {
      const v = clamp(n + 1, 1, 5);
      onIntensityChange?.(v);
      return v;
    });
    handleSwap();
  };

  const handleMinus = () => {
    setIntensity((n) => {
      const v = clamp(n - 1, 1, 5);
      onIntensityChange?.(v);
      return v;
    });
    handleSwap();
  };

  const handleHelp = () => {
    // TODO: Navigate to tutorial
    console.log('前往動作教學');
  };

  const handleAction = (action: string) => {
    switch(action) {
      case 'swap': handleSwap(); break;
      case 'plus': handlePlus(); break;
      case 'minus': handleMinus(); break;
      case 'help': handleHelp(); break;
    }
  };

  /** Icon Components */
  const renderSectorIcon = (iconType: string, x: number, y: number) => {
    switch(iconType) {
      case 'swap':
        return (
          <G transform={`translate(${x-12}, ${y-12})`}>
            <Path
              d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"
              fill="#EAEAF0"
            />
          </G>
        );
      case 'plus':
        return (
          <G transform={`translate(${x-12}, ${y-12})`}>
            <Path
              d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
              fill="#EAEAF0"
            />
          </G>
        );
      case 'minus':
        return (
          <G transform={`translate(${x-12}, ${y-12})`}>
            <Path
              d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
              fill="#EAEAF0"
            />
          </G>
        );
      case 'help':
        return (
          <G transform={`translate(${x-12}, ${y-12})`}>
            <Path
              d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
              fill="#EAEAF0"
            />
          </G>
        );
    }
  };

  const PlayIcon = () =>
    playing ? (
      <G>
        <Rect x={cx - 8} y={cy - 14} width={4} height={28} rx={1.5} fill="#23C074" />
        <Rect x={cx + 4} y={cy - 14} width={4} height={28} rx={1.5} fill="#23C074" />
      </G>
    ) : (
      <Polygon
        points={`${cx - 8},${cy - 14} ${cx + 16},${cy} ${cx - 8},${cy + 14}`}
        fill="#23C074"
      />
    );

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Brand */}
      <Text style={styles.title}>SnackFit</Text>

      {/* Location chips */}
      <View style={styles.chipsRow}>
        {locations.map((loc, idx) => (
          <Pressable
            key={loc}
            onPress={() => setActiveLocation(idx)}
          >
            <View style={[styles.chip, activeLocation === idx && styles.chipActive]}>
              <Text style={[styles.chipText, activeLocation === idx && styles.chipTextActive]}>
                {loc}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.canvas, { width: size, height: size + 50 }]}>
        {/* Action capsule */}
        <View style={styles.actionCapsule}>
          <View style={styles.capsuleIcon}>
            <Text style={styles.capsuleEmoji}>🍪</Text>
          </View>
          <Text style={styles.actionName} numberOfLines={1}>{actionName}</Text>
        </View>

        <Svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size}>
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            {/* 外環週進度背景 */}
            <Circle
              cx={cx}
              cy={cy}
              r={rOuter}
              stroke="rgba(168,140,245,.20)"
              strokeWidth={24}
              fill="none"
            />
            {/* 外環週進度 */}
            <Circle
              cx={cx}
              cy={cy}
              r={rOuter}
              stroke="#A88CF5"
              strokeWidth={24}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={weekDash}
            />
            {/* 內環日進度背景 */}
            <Circle
              cx={cx}
              cy={cy}
              r={rInner}
              stroke="rgba(35,192,116,.20)"
              strokeWidth={24}
              fill="none"
            />
            {/* 內環日進度 */}
            <Circle
              cx={cx}
              cy={cy}
              r={rInner}
              stroke="#23C074"
              strokeWidth={24}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={dayDash}
            />
          </G>

          {/* 分隔線 */}
          {dividerAngles.map((angle, idx) => {
            const inner = polarToCartesian(cx, cy, r1, angle);
            const outer = polarToCartesian(cx, cy, r2, angle);
            return (
              <Line
                key={idx}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,255,255,.12)"
                strokeWidth={1}
              />
            );
          })}

          {/* 扇形按鈕 */}
          {sectors.map((sector) => {
            const path = donutPath(cx, cy, r1, r2, sector.a0, sector.a1);
            const midAngle = (sector.a0 + sector.a1) / 2;
            const iconR = (r1 + r2) / 2;
            const iconPos = polarToCartesian(cx, cy, iconR, midAngle);
            
            return (
              <G key={sector.id}>
                <Path
                  d={path}
                  fill="rgba(255,255,255,.08)"
                  stroke="rgba(255,255,255,.18)"
                  strokeWidth={1.5}
                  onPress={() => handleAction(sector.action)}
                />
                {renderSectorIcon(sector.icon, iconPos.x, iconPos.y)}
              </G>
            );
          })}

          {/* 中央播放按鈕 */}
          <G onPress={handleToggle}>
            <Circle
              cx={cx}
              cy={cy}
              r={centerR}
              fill="#1F1F24"
              stroke="#23C074"
              strokeWidth={4}
            />
            <PlayIcon />
          </G>
        </Svg>
      </View>

      {/* 進度卡 */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.labelGreen}>今日進度</Text>
          <Text style={styles.valueGreen}>
            {Math.round(dayProgress * 20)}/{20} 分鐘
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.labelPurple}>本週進度</Text>
          <Text style={styles.valuePurple}>
            {Math.round(weekProgress * 150)}/{150} 分鐘
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SnackcerciseDashboard;

/** Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#0E0E10",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#EAEAF0",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(26, 26, 30, .6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, .08)",
  },
  chipActive: {
    backgroundColor: "rgba(168, 140, 245, .26)",
    borderColor: "#A88CF5",
  },
  chipText: {
    color: "#CFCFD8",
    fontSize: 11,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#EAEAF0",
  },
  canvas: {
    alignItems: "center",
    position: "relative",
  },
  actionCapsule: {
    position: "absolute",
    top: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.10)",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  capsuleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FDE3A7",
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleEmoji: {
    fontSize: 12,
  },
  actionName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#EAEAF0",
    letterSpacing: 0.3,
  },
  card: {
    width: "92%",
    maxWidth: 400,
    backgroundColor: "#16161A",
    borderWidth: 1,
    borderColor: "#2A2B31",
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  labelGreen: {
    fontSize: 14,
    fontWeight: "700",
    color: "#23C074",
  },
  valueGreen: {
    fontSize: 14,
    fontWeight: "800",
    color: "#23C074",
  },
  labelPurple: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A88CF5",
  },
  valuePurple: {
    fontSize: 14,
    fontWeight: "800",
    color: "#A88CF5",
  },
});