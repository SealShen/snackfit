// SnackcerciseDashboard.tsx
import React, { useCallback, useMemo, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Helpers */
const toRad = (deg: number) => (Math.PI / 180) * deg;
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = toRad(deg - 90);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutPath(
  cx: number, cy: number, rInner: number, rOuter: number, startAngle: number, endAngle: number
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
  initialActionName = "平板支撐",
  actionPool = ["伏地挺身", "弓箭步", "深蹲", "開合跳"],
  onSwap,
  onPlayToggle,
  onIntensityChange,
  locations = ["家裡", "辦公室", "健身房", "車站"],
}) => {
  const [playing, setPlaying] = useState(false);
  const [intensity, setIntensity] = useState(clamp(initialIntensity, 1, 5));
  const [currentCard, setCurrentCard] = useState(0);
  const [size, setSize] = useState(360);
  const [activeLocation, setActiveLocation] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const safeTopPadding = Math.max(insets.top, 20) + 20;

  // 建立運動卡片資料
  const exerciseCards = useMemo(() => [
    { 
      name: initialActionName, 
      duration: "2 分鐘", 
      snackEmoji: "🍪", 
      sportIcon: "yoga" as const,
      desc: "適合辦公室" 
    },
    ...actionPool.map((name, idx) => ({
      name,
      duration: "2 分鐘",
      snackEmoji: ["🍩", "🧁", "🥨", "🍰"][idx % 4],
      sportIcon: (["arm-flex", "run", "gymnastics", "human-handsup"] as const)[idx % 4],
      desc: ["提升心肺", "核心訓練", "下肢力量", "全身協調"][idx % 4]
    }))
  ], [initialActionName, actionPool]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setSize(Math.max(320, Math.min(440, w - 48)));
  }, []);

  // Geometry
  const vb = 360;
  const cx = 180;
  const cy = 180;
  const rOuter = 156;
  const rInner = 128;
  const r2 = rInner - 2;
  const r1 = 60;
  const centerR = 64;
  const stroke = 24;

  const sectors = [
    { id: "top", a0: -45, a1: 45, action: "swap", icon: "swap" },
    { id: "right", a0: 45, a1: 135, action: "plus", icon: "plus" },
    { id: "bottom", a0: 135, a1: 225, action: "help", icon: "help" },
    { id: "left", a0: 225, a1: 315, action: "minus", icon: "minus" },
  ];
  const dividerAngles = [45, 135, 225, 315];

  const dayLen = 2 * Math.PI * rInner;
  const weekLen = 2 * Math.PI * rOuter;
  const dayDash = [dayLen * clamp(dayProgress, 0, 1), dayLen];
  const weekDash = [weekLen * clamp(weekProgress, 0, 1), weekLen];

  const remainingMins = 20 - Math.round(dayProgress * 20);

  /** interactions */
  const handleToggle = () => {
    const val = !playing;
    setPlaying(val);
    onPlayToggle?.(val);
  };

  const handleSwap = () => {
    const nextCard = (currentCard + 1) % exerciseCards.length;
    setCurrentCard(nextCard);
    scrollViewRef.current?.scrollTo({
      x: nextCard * SCREEN_WIDTH,
      animated: true
    });
    onSwap?.(exerciseCards[nextCard].name);
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

  const handleHelp = () => console.log("前往動作教學");

  const handleAction = (action: string) => {
    switch (action) {
      case "swap": handleSwap(); break;
      case "plus": handlePlus(); break;
      case "minus": handleMinus(); break;
      case "help": handleHelp(); break;
    }
  };

  const renderSectorIcon = (iconType: string, x: number, y: number) => {
    const color = "#EAEAF0";
    const d = {
      swap: "M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z",
      plus: "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
      minus: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
      help: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
    } as const;
    return (
      <G transform={`translate(${x - 12}, ${y - 12})`}>
        <Path d={d[iconType as keyof typeof d]} fill={color} />
      </G>
    );
  };

  const PlayIcon = () =>
    playing ? (
      <G>
        <Rect x={cx - 10} y={cy - 16} width={5} height={32} rx={2} fill="#23C074" />
        <Rect x={cx + 5} y={cy - 16} width={5} height={32} rx={2} fill="#23C074" />
      </G>
    ) : (
      <Polygon points={`${cx - 10},${cy - 18} ${cx + 20},${cy} ${cx - 10},${cy + 18}`} fill="#23C074" />
    );

  return (
    <View style={[styles.container, { paddingTop: safeTopPadding }]} onLayout={onLayout}>
      <Text style={styles.title}>SnackFit</Text>

      <View style={styles.chipsRow}>
        {locations.map((loc, idx) => (
          <Pressable key={loc} onPress={() => setActiveLocation(idx)}>
            <View style={[styles.chip, activeLocation === idx && styles.chipActive]}>
              <Text style={[styles.chipText, activeLocation === idx && styles.chipTextActive]}>
                {loc}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.canvas, { width: size, height: size + 20 }]}>
        {/* 運動卡片輪播 */}
        <View style={styles.cardsContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentCard(newIndex);
            }}
            contentContainerStyle={styles.cardsContent}
          >
            {exerciseCards.map((card, idx) => (
              <View key={idx} style={[styles.cardWrapper, { width: SCREEN_WIDTH }]}>
                <View style={styles.exerciseCard}>
                <View style={styles.cardTop}>
                  <View style={styles.cardIconLarge}>
                    <Text style={styles.cardEmoji}>{card.snackEmoji}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    <Text style={styles.cardDesc}>{card.desc}</Text>
                  </View>
                  <Pressable style={styles.cardInfoIcon}>
                    <Text style={styles.infoText}>ℹ️</Text>
                  </Pressable>
                </View>
                <View style={styles.cardBottom}>
                  <MaterialCommunityIcons name={card.sportIcon} size={14} color="#23C074" />
                  <Text style={styles.cardDuration}>{card.duration}</Text>
                </View>
              </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.pagination}>
            {exerciseCards.map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, currentCard === idx && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <Svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size}>
          <G transform={`rotate(-90 ${cx} ${cy})`}>
            <Circle cx={cx} cy={cy} r={rOuter} stroke="rgba(185,155,255,.20)" strokeWidth={stroke} fill="none" />
            <Circle cx={cx} cy={cy} r={rOuter} stroke="#B99BFF" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={weekDash} />
            <Circle cx={cx} cy={cy} r={rInner} stroke="rgba(35,192,116,.20)" strokeWidth={stroke} fill="none" />
            <Circle cx={cx} cy={cy} r={rInner} stroke="#23C074" strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={dayDash} />
          </G>

          {dividerAngles.map((angle, idx) => {
            const inner = polarToCartesian(cx, cy, r1, angle);
            const outer = polarToCartesian(cx, cy, r2, angle);
            return (
              <Line key={idx} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,.12)" strokeWidth={1} />
            );
          })}

          {sectors.map((sector) => {
            const midAngle = (sector.a0 + sector.a1) / 2;
            const iconR = (r1 + r2) / 2;
            const iconPos = polarToCartesian(cx, cy, iconR, midAngle);
            const touchPath = donutPath(cx, cy, r1 - 8, r2 + 12, sector.a0, sector.a1);
            return (
              <G key={sector.id}>
                <Path d={touchPath} fill="rgba(0,0,0,0.001)" stroke="transparent" onPress={() => handleAction(sector.action)} />
                {renderSectorIcon(sector.icon, iconPos.x, iconPos.y)}
              </G>
            );
          })}

          <G onPress={handleToggle}>
            <Circle cx={cx} cy={cy} r={centerR} fill="#1F1F24" stroke="#23C074" strokeWidth={5} />
            <PlayIcon />
            <SvgText x={cx} y={cy - 36} fontSize={11} fill="#A0A1B2" fontWeight="600" textAnchor="middle" pointerEvents="none">
              Time left today
            </SvgText>
            <SvgText x={cx} y={cy + 40} fontSize={16} fill="#23C074" fontWeight="900" textAnchor="middle" pointerEvents="none">
              {`${remainingMins} min`}
            </SvgText>
          </G>
        </Svg>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.labelGreen}>今日進度</Text>
          <Text style={styles.valueGreen}>{Math.round(dayProgress * 20)}/{20} 分鐘</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.labelPurple}>本週進度</Text>
          <Text style={styles.valuePurple}>{Math.round(weekProgress * 150)}/{150} 分鐘</Text>
        </View>
      </View>
    </View>
  );
};

export default SnackcerciseDashboard;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", backgroundColor: "#0E0E10", paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "900", color: "#EAEAF0", letterSpacing: 0.5, marginBottom: 12 },
  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 28 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "rgba(26,26,30,.6)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)"
  },
  chipActive: { backgroundColor: "rgba(185,155,255,.26)", borderColor: "#B99BFF" },
  chipText: { color: "#CFCFD8", fontSize: 11, fontWeight: "800" },
  chipTextActive: { color: "#EAEAF0" },
  canvas: { alignItems: "center", position: "relative", marginTop: 100 },
  
  cardsContainer: {
    position: "absolute",
    top: -108,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  cardsContent: {
    paddingHorizontal: 0,
  },
  cardWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseCard: {
    backgroundColor: "rgba(22, 22, 26, 0.95)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.12)",
    padding: 14,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  cardIconLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(185, 155, 255, .2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 18,
  },
  cardInfo: {
    flex: 0,
    minWidth: 100,
    maxWidth: 240,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#EAEAF0",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    fontWeight: "600",
    color: "#A0A1B2",
  },
  cardInfoIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,.06)",
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: "700",
    color: "#23C074",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.2)",
  },
  dotActive: {
    backgroundColor: "#B99BFF",
    width: 18,
  },
  
  card: {
    width: "92%", maxWidth: 400, backgroundColor: "#16161A",
    borderWidth: 1, borderColor: "#2A2B31", borderRadius: 20,
    padding: 16, marginTop: -16
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  labelGreen: { fontSize: 14, fontWeight: "700", color: "#23C074" },
  valueGreen: { fontSize: 14, fontWeight: "800", color: "#23C074" },
  labelPurple: { fontSize: 14, fontWeight: "700", color: "#B99BFF" },
  valuePurple: { fontSize: 14, fontWeight: "800", color: "#B99BFF" },
});