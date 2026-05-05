import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, AppState, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
    Path,
    Line,
    Text as SvgText,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
    Circle,
    Rect,
} from 'react-native-svg';
import Animated, {
    FadeIn,
    FadeInDown,
    ZoomIn,
    Easing,
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    useAnimatedProps,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { subDays, startOfDay, format } from 'date-fns';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { FadeInSlot } from '../src/components/FadeInSlot';
import { PressableScale } from '../src/components/PressableScale';
import { calculateStackedCaffeine, calculateAlertness } from '../src/utils/math';
import { FEATURES } from '../src/config/featureFlags';
import { useReduceMotion } from '../src/hooks/useReduceMotion';
import { ROW_STAGGER_MS, BENTO_STAGGER_MS } from '../src/constants/motion';

const CHART_W = 340;
const CHART_H = 180;
const PAD = { top: 20, right: 15, bottom: 30, left: 40 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const STATS_SLOTS = { header: 0, hero: 1, metrics: 2, chart: 3, table: 4 } as const;
const HOUR_ROW_ANIM_CAP = 12;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedScrollView = Animated.ScrollView;

interface HourlyEntry {
    time: string;
    level: number;
    status: string;
    statusColor: string;
    isPast: boolean;
    isNow: boolean;
    hourOffset: number;
}

interface DayRollup {
    date: string;
    weekday: string;
    totalMg: number;
    doseCount: number;
}

function createSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
}

/** Chord-sum lower bound — scale up slightly so dash draw covers smooth curve */
function approximateLineDrawLength(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 40;
    let s = 0;
    for (let i = 1; i < points.length; i++) {
        s += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return Math.max(s * 1.14, 12);
}

type BentoIcon = React.ComponentProps<typeof Ionicons>['name'];

function BentoTile({
    icon,
    label,
    value,
    hint,
    colors,
    theme,
    tileIndex,
    enableMotion,
}: {
    icon: BentoIcon;
    label: string;
    value: string;
    hint?: string;
    colors: (typeof Colors)['light'];
    theme: 'light' | 'dark';
    tileIndex: number;
    enableMotion: boolean;
}) {
    const surface =
        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    const inner = (
        <View style={[styles.bentoTile, { backgroundColor: surface, borderColor: colors.border }]}>
            <View style={styles.bentoTileTop}>
                {enableMotion ? (
                    <Animated.View
                        entering={ZoomIn.delay(tileIndex * BENTO_STAGGER_MS + 22)
                            .springify()
                            .damping(16)
                            .stiffness(260)}
                    >
                        <Ionicons name={icon} size={18} color={colors.primary} />
                    </Animated.View>
                ) : (
                    <Ionicons name={icon} size={18} color={colors.primary} />
                )}
                <Text style={[styles.bentoValue, { color: colors.text }]} numberOfLines={1}>
                    {value}
                </Text>
            </View>
            <Text style={[styles.bentoLabel, { color: colors.textSecondary }]} numberOfLines={2}>
                {label}
            </Text>
            {hint ? (
                <Text style={[styles.bentoHint, { color: colors.textSecondary }]} numberOfLines={1}>
                    {hint}
                </Text>
            ) : null}
        </View>
    );

    if (!enableMotion) {
        return inner;
    }

    return (
        <Animated.View
            entering={FadeIn.delay(tileIndex * BENTO_STAGGER_MS).duration(220)}
        >
            {inner}
        </Animated.View>
    );
}

function HourlySegmentChip({
    label,
    selected,
    onPress,
    colors,
    theme,
    enableMotion,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    colors: (typeof Colors)['light'];
    theme: 'light' | 'dark';
    enableMotion: boolean;
}) {
    const scale = useSharedValue(selected ? 1.035 : 1);

    useEffect(() => {
        if (!enableMotion) {
            scale.value = 1;
            return;
        }
        scale.value = withSpring(selected ? 1.045 : 1, {
            damping: 15,
            stiffness: 220,
            mass: 0.65,
        });
    }, [selected, enableMotion, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const chipInner = (
        <PressableScale
            onPress={onPress}
            style={[
                styles.segmentChip,
                {
                    backgroundColor: selected
                        ? colors.primary + '22'
                        : theme === 'dark'
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                    borderColor: selected ? colors.primary : colors.border,
                },
            ]}
        >
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: selected ? colors.primary : colors.textSecondary,
                }}
            >
                {label}
            </Text>
        </PressableScale>
    );

    if (!enableMotion) {
        return chipInner;
    }

    return <Animated.View style={animatedStyle}>{chipInner}</Animated.View>;
}

export default function DetailedStatsScreen() {
    const router = useRouter();
    const reduceMotion = useReduceMotion();
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];
    const doses = useCaffeineStore(state => state.doses);
    const sleepThreshold = useCaffeineStore(state => state.sleepThresholdMg);
    const weightKg = useCaffeineStore(state => state.weightKg);
    const sleepQuality = useCaffeineStore(state => state.sleepQuality);
    const use24HourFormat = useCaffeineStore(state => state.use24HourFormat);
    const getEffectiveHalfLife = useCaffeineStore(state => state.getEffectiveHalfLife);
    const currentLevel = useCaffeineStore(state => state.currentLevel);
    const storeClearanceTime = useCaffeineStore(state => state.clearanceTime);

    const [currentTime, setCurrentTime] = useState(Date.now());
    const [hourlyFilter, setHourlyFilter] = useState<'all' | 'past' | 'future'>('all');
    const [heroMg, setHeroMg] = useState(() =>
        Math.round(useCaffeineStore.getState().currentLevel)
    );

    const currentLevelRef = useRef(useCaffeineStore.getState().currentLevel);
    const screenFocusedRef = useRef(false);
    const prevLevelSyncRef = useRef<number | null>(null);

    useEffect(() => {
        currentLevelRef.current = currentLevel;
    }, [currentLevel]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                setCurrentTime(Date.now());
            }
        });
        return () => subscription.remove();
    }, []);

    const effectiveHalfLife = getEffectiveHalfLife();
    const now = currentTime;

    const qualityMultiplier = sleepQuality === 'great' ? 1.0 : sleepQuality === 'average' ? 0.8 : 0.6;

    const motionOn = FEATURES.UI_MOTION && !reduceMotion;
    const scrollY = useSharedValue(0);
    const lineDashOffset = useSharedValue(0);

    useFocusEffect(
        useCallback(() => {
            screenFocusedRef.current = true;
            prevLevelSyncRef.current = null;

            const target = Math.round(currentLevelRef.current);

            if (!FEATURES.UI_MOTION || reduceMotion) {
                setHeroMg(target);
                return () => {
                    screenFocusedRef.current = false;
                    prevLevelSyncRef.current = null;
                };
            }

            const start = Math.round(
                Math.min(target, Math.max(0, target * 0.65))
            );
            setHeroMg(start);

            let frame = 0;
            const t0 = Date.now();
            const dur = 400;
            const ease = (u: number) => 1 - Math.pow(1 - u, 3);

            const tick = () => {
                const u = Math.min(1, (Date.now() - t0) / dur);
                setHeroMg(Math.round(start + (target - start) * ease(u)));
                if (u < 1) {
                    frame = requestAnimationFrame(tick);
                }
            };
            frame = requestAnimationFrame(tick);

            return () => {
                screenFocusedRef.current = false;
                prevLevelSyncRef.current = null;
                cancelAnimationFrame(frame);
            };
        }, [reduceMotion])
    );

    useEffect(() => {
        if (!screenFocusedRef.current) {
            return;
        }
        if (prevLevelSyncRef.current === null) {
            prevLevelSyncRef.current = currentLevel;
            return;
        }
        if (prevLevelSyncRef.current === currentLevel) {
            return;
        }
        prevLevelSyncRef.current = currentLevel;
        setHeroMg(Math.round(currentLevel));
    }, [currentLevel]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: e => {
            scrollY.value = e.contentOffset.y;
        },
    });

    const parallaxStyle = useAnimatedStyle(() => {
        const y = scrollY.value * 0.045;
        const ty = Math.min(12, Math.max(-12, y));
        return { transform: [{ translateY: ty }] };
    });

    const timeFmt = use24HourFormat ? 'HH:mm' : 'h:mm a';

    const chartData = useMemo(() => {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayDoses = doses.filter(d => d.timestamp >= todayStart.getTime());
        const defaultStart = now - 2 * 60 * 60 * 1000;
        let startTime = defaultStart;
        if (todayDoses.length > 0) {
            const oldestDoseTime = Math.min(...todayDoses.map(d => d.timestamp));
            startTime = Math.min(defaultStart, oldestDoseTime - 1 * 60 * 60 * 1000);
        }
        const endTime = now + 12 * 60 * 60 * 1000;
        const totalDuration = endTime - startTime;
        const totalPoints = Math.max(84, Math.round(totalDuration / (10 * 60 * 1000)));
        const step = totalDuration / totalPoints;

        const points: { t: number; level: number; x: number }[] = [];
        let maxLevel = 0;

        for (let i = 0; i <= totalPoints; i++) {
            const t = startTime + i * step;
            const level = calculateStackedCaffeine(doses, t, effectiveHalfLife);
            maxLevel = Math.max(maxLevel, level);
            points.push({ t, level, x: 0 });
        }

        const maxScale = Math.max(maxLevel * 1.15, sleepThreshold * 1.3, 50);
        const getX = (i: number) => PAD.left + (i / totalPoints) * INNER_W;
        const getY = (v: number) => PAD.top + INNER_H - (v / maxScale) * INNER_H;

        const svgPoints = points.map((p, i) => ({ x: getX(i), y: getY(p.level) }));
        const linePath = createSmoothPath(svgPoints);
        const linePathLength = approximateLineDrawLength(svgPoints);

        const areaPath =
            linePath +
            ` L ${getX(totalPoints)} ${PAD.top + INNER_H}` +
            ` L ${getX(0)} ${PAD.top + INNER_H} Z`;

        const hourLabels: { x: number; label: string }[] = [];
        for (let i = 0; i <= totalPoints; i++) {
            const date = new Date(points[i].t);
            if (date.getMinutes() < 10) {
                const h = date.getHours();
                const label = h === 0 ? '12' : h > 12 ? String(h - 12) : String(h);
                hourLabels.push({ x: getX(i), label });
            }
        }

        const nightZones: { x: number; width: number }[] = [];
        let nightStart: number | null = null;
        for (let i = 0; i <= totalPoints; i++) {
            const hour = new Date(points[i].t).getHours();
            const isNight = hour >= 18 || hour < 6;
            if (isNight && nightStart === null) {
                nightStart = getX(i);
            } else if (!isNight && nightStart !== null) {
                nightZones.push({ x: nightStart, width: getX(i) - nightStart });
                nightStart = null;
            }
        }
        if (nightStart !== null) {
            nightZones.push({ x: nightStart, width: getX(totalPoints) - nightStart });
        }

        let nowIdx = 0;
        let minDiff = Infinity;
        points.forEach((p, i) => {
            const d = Math.abs(p.t - now);
            if (d < minDiff) {
                minDiff = d;
                nowIdx = i;
            }
        });
        const nowX = getX(nowIdx);
        const nowY = getY(points[nowIdx].level);

        const thresholdY = getY(sleepThreshold);

        const nightZoneFill =
            theme === 'dark' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.055)';

        return {
            linePath,
            linePathLength,
            areaPath,
            hourLabels,
            nowX,
            nowY,
            thresholdY,
            maxScale,
            nightZones,
            nightZoneFill,
        };
    }, [doses, now, effectiveHalfLife, sleepThreshold, theme]);

    useEffect(() => {
        const L = chartData.linePathLength;
        if (!motionOn || Platform.OS === 'web' || L < 8) {
            lineDashOffset.value = 0;
            return;
        }
        lineDashOffset.value = L;
        lineDashOffset.value = withTiming(0, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
        });
    }, [motionOn, chartData.linePath, chartData.linePathLength]);

    const lineAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: lineDashOffset.value,
    }));

    const hourlyBreakdown = useMemo(() => {
        const entries: HourlyEntry[] = [];
        for (let h = -10; h <= 12; h++) {
            const t = now + h * 60 * 60 * 1000;
            const level = calculateStackedCaffeine(doses, t, effectiveHalfLife);
            const rounded = Math.round(level);

            let status = 'Low';
            let statusColor = '#34C759';
            if (rounded > 200) {
                status = 'Very High';
                statusColor = '#FF3B30';
            } else if (rounded > 100) {
                status = 'High';
                statusColor = '#FF9500';
            } else if (rounded > sleepThreshold) {
                status = 'Moderate';
                statusColor = '#FFD60A';
            } else if (rounded > 20) {
                status = 'Descending';
                statusColor = '#5856D6';
            }

            if (h > -10) {
                const prevLevel = calculateStackedCaffeine(
                    doses,
                    now + (h - 1) * 60 * 60 * 1000,
                    effectiveHalfLife
                );
                if (prevLevel > 80 && rounded < 50) {
                    status = 'Crash Risk';
                    statusColor = '#FF3B30';
                }
            }

            entries.push({
                time: format(new Date(t), timeFmt),
                level: rounded,
                status,
                statusColor,
                isPast: h < 0,
                isNow: h === 0,
                hourOffset: h,
            });
        }
        return entries;
    }, [doses, now, effectiveHalfLife, sleepThreshold, timeFmt]);

    const sevenDays: DayRollup[] = useMemo(() => {
        const out: DayRollup[] = [];
        for (let i = 6; i >= 0; i--) {
            const day = startOfDay(subDays(new Date(now), i));
            const ds = day.getTime();
            const de = ds + 86400000;
            const dayDoses = doses.filter(d => d.timestamp >= ds && d.timestamp < de);
            out.push({
                date: format(day, 'yyyy-MM-dd'),
                weekday: format(day, 'EEE'),
                totalMg: dayDoses.reduce((s, d) => s + d.mg, 0),
                doseCount: dayDoses.length,
            });
        }
        return out;
    }, [doses, now]);

    let peakAlertness = -Infinity;
    let peakTime = now;
    for (let t = now; t <= now + 6 * 60 * 60 * 1000; t += 5 * 60 * 1000) {
        const alertness = calculateAlertness(doses, t, effectiveHalfLife, undefined, qualityMultiplier);
        if (alertness > peakAlertness) {
            peakAlertness = alertness;
            peakTime = t;
        }
    }

    const isClear = storeClearanceTime === null || currentLevel <= sleepThreshold;
    const clearanceTime = storeClearanceTime ?? now;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayDoses = doses.filter(d => d.timestamp >= todayStart.getTime());
    const sortedToday = [...todayDoses].sort((a, b) => a.timestamp - b.timestamp);
    const firstDoseToday = sortedToday[0];
    const totalToday = todayDoses.reduce((sum, d) => sum + d.mg, 0);
    const todayRollup = sevenDays[sevenDays.length - 1];

    let peakCaffeineToday = 0;
    for (const dose of todayDoses) {
        const levelAtDose = calculateStackedCaffeine(doses, dose.timestamp, effectiveHalfLife);
        if (levelAtDose > peakCaffeineToday) peakCaffeineToday = levelAtDose;
    }
    if (currentLevel > peakCaffeineToday) peakCaffeineToday = currentLevel;

    const sum7Mg = sevenDays.reduce((s, d) => s + d.totalMg, 0);
    const totalDoses7 = sevenDays.reduce((s, d) => s + d.doseCount, 0);
    const daysWithIntake = sevenDays.filter(d => d.doseCount > 0);
    const avgMgPerDayActive =
        daysWithIntake.length > 0 ? sum7Mg / daysWithIntake.length : 0;
    const avgMgPerDrink7 = totalDoses7 > 0 ? sum7Mg / totalDoses7 : 0;

    let bestDay: DayRollup | null = null;
    let quietDay: DayRollup | null = null;
    if (daysWithIntake.length > 0) {
        bestDay = daysWithIntake.reduce((a, b) => (a.totalMg >= b.totalMg ? a : b));
        quietDay = daysWithIntake.reduce((a, b) => (a.totalMg <= b.totalMg ? a : b));
    }

    let vsAvgCopy: string | null = null;
    if (avgMgPerDayActive > 0 && todayRollup.doseCount > 0) {
        const diffPct = Math.round(
            ((todayRollup.totalMg - avgMgPerDayActive) / avgMgPerDayActive) * 100
        );
        if (diffPct === 0) vsAvgCopy = 'On your 7-day average';
        else if (diffPct > 0) vsAvgCopy = `${diffPct}% above 7-day average`;
        else vsAvgCopy = `${Math.abs(diffPct)}% below 7-day average`;
    }

    const weekMaxMg = Math.max(...sevenDays.map(d => d.totalMg), 1);

    const visibleHourly =
        hourlyFilter === 'all'
            ? hourlyBreakdown
            : hourlyFilter === 'past'
              ? hourlyBreakdown.filter(e => e.isPast)
              : hourlyBreakdown.filter(e => !e.isPast);

    const tableBorder = colors.border;
    const zebra = theme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';

    const gradientColors =
        theme === 'dark'
            ? (['#050505', '#1c1c1e', '#151515'] as const)
            : (['#EFEFF4', '#F9F9FB', '#FFFFFF'] as const);

    const chartBreathEntering = motionOn
        ? FadeInDown.delay(90).springify().damping(22).stiffness(268)
        : undefined;

    const drawLineMotion =
        motionOn && Platform.OS !== 'web';

    const trendChartBody = (
        <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Trend</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                12-hour forecast vs sleep line
            </Text>
            <Svg width={CHART_W} height={CHART_H}>
                <Defs>
                    <SvgLinearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={colors.primary} stopOpacity={0.25} />
                        <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                    </SvgLinearGradient>
                </Defs>

                {chartData.nightZones.map((zone, i) => (
                    <Rect
                        key={`night-${i}`}
                        x={zone.x}
                        y={PAD.top}
                        width={zone.width}
                        height={INNER_H}
                        fill={chartData.nightZoneFill}
                        rx={4}
                    />
                ))}

                <Path d={chartData.areaPath} fill="url(#detailGrad)" />

                {drawLineMotion ? (
                    <AnimatedPath
                        d={chartData.linePath}
                        stroke={colors.primary}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={[
                            chartData.linePathLength,
                            chartData.linePathLength,
                        ]}
                        animatedProps={lineAnimatedProps}
                    />
                ) : (
                    <Path
                        d={chartData.linePath}
                        stroke={colors.primary}
                        strokeWidth={2.5}
                        fill="none"
                        strokeLinecap="round"
                    />
                )}

                <Line
                    x1={PAD.left}
                    y1={chartData.thresholdY}
                    x2={CHART_W - PAD.right}
                    y2={chartData.thresholdY}
                    stroke={colors.accent}
                    strokeWidth={1}
                    strokeDasharray="5,3"
                    strokeOpacity={0.5}
                />
                <SvgText
                    x={CHART_W - PAD.right - 2}
                    y={chartData.thresholdY - 4}
                    fill={colors.accent}
                    fontSize={8}
                    textAnchor="end"
                    opacity={0.65}
                >
                    Sleep {sleepThreshold} mg
                </SvgText>

                <Line
                    x1={chartData.nowX}
                    y1={PAD.top}
                    x2={chartData.nowX}
                    y2={PAD.top + INNER_H}
                    stroke={colors.primary}
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                    strokeOpacity={0.5}
                />
                <Circle cx={chartData.nowX} cy={chartData.nowY} r={5} fill={colors.primary} opacity={0.3} />
                <Circle cx={chartData.nowX} cy={chartData.nowY} r={3} fill={colors.primary} />

                {chartData.hourLabels.map((lab, i) => (
                    <SvgText
                        key={i}
                        x={lab.x}
                        y={PAD.top + INNER_H + 16}
                        fill={colors.textSecondary}
                        fontSize={9}
                        textAnchor="middle"
                        opacity={0.65}
                    >
                        {lab.label}
                    </SvgText>
                ))}
            </Svg>
        </>
    );

    const MainScroll =
        FEATURES.UI_MOTION && Platform.OS !== 'web' ? AnimatedScrollView : ScrollView;
    const scrollProps =
        FEATURES.UI_MOTION && Platform.OS !== 'web'
            ? {
                  onScroll: scrollHandler,
                  scrollEventThrottle: 16 as const,
              }
            : {};

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {motionOn ? (
                <Animated.View
                    style={[StyleSheet.absoluteFillObject, parallaxStyle]}
                    pointerEvents="none"
                >
                    <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
                </Animated.View>
            ) : (
                <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
            )}
            <SafeAreaView style={styles.safeArea}>
                <FadeInSlot slotIndex={STATS_SLOTS.header} variant="fast">
                    <View style={styles.header}>
                        <PressableScale
                            onPress={() => router.back()}
                            style={[
                                styles.backButton,
                                {
                                    backgroundColor:
                                        theme === 'dark'
                                            ? 'rgba(255,255,255,0.1)'
                                            : 'rgba(0,0,0,0.05)',
                                },
                            ]}
                        >
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </PressableScale>
                        <Text style={[styles.title, { color: colors.text }]}>Detailed Statistics</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </FadeInSlot>

                <MainScroll
                    {...scrollProps}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <FadeInSlot slotIndex={STATS_SLOTS.hero} variant="fast">
                        <GlassmorphicCard style={[styles.heroCard, { marginVertical: 8 }]}>
                            <Text style={[styles.heroEyebrow, { color: colors.textSecondary }]}>
                                Current level
                            </Text>
                            <Text style={[styles.heroMg, { color: colors.primary }]}>
                                {heroMg}
                                <Text style={[styles.heroMgUnit, { color: colors.textSecondary }]}>
                                    {' '}
                                    mg
                                </Text>
                            </Text>
                            <Text style={[styles.heroSub, { color: colors.text }]}>
                                {todayDoses.length} drink{todayDoses.length !== 1 ? 's' : ''} ·{' '}
                                {Math.round(totalToday)} mg today
                            </Text>
                            {firstDoseToday ? (
                                <Text style={[styles.heroMicro, { color: colors.textSecondary }]}>
                                    First dose {format(new Date(firstDoseToday.timestamp), timeFmt)}
                                    {peakCaffeineToday > 0
                                        ? ` · Peak today ${Math.round(peakCaffeineToday)} mg`
                                        : ''}
                                </Text>
                            ) : null}
                            <View style={[styles.heroDivider, { backgroundColor: tableBorder }]} />
                            <Text style={[styles.heroMicro, { color: colors.textSecondary }]}>
                                {isClear
                                    ? `Below ${sleepThreshold} mg — clear for sleep`
                                    : `Below ${sleepThreshold} mg by ${format(new Date(clearanceTime), timeFmt)}`}
                            </Text>
                        </GlassmorphicCard>
                    </FadeInSlot>

                    <FadeInSlot slotIndex={STATS_SLOTS.metrics} variant="fast">
                        <View style={styles.sectionBlock}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                Last 7 days
                            </Text>
                            <View style={styles.weekStrip}>
                                {sevenDays.map(d => {
                                    const h = d.totalMg <= 0 ? 4 : 8 + (d.totalMg / weekMaxMg) * 28;
                                    return (
                                        <View key={d.date} style={styles.weekBarCol}>
                                            <View
                                                style={[
                                                    styles.weekBar,
                                                    {
                                                        height: h,
                                                        backgroundColor:
                                                            d.doseCount > 0
                                                                ? colors.primary
                                                                : colors.border,
                                                        opacity: d.doseCount > 0 ? 0.9 : 0.35,
                                                    },
                                                ]}
                                            />
                                            <Text
                                                style={[styles.weekBarLabel, { color: colors.textSecondary }]}
                                            >
                                                {d.weekday}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                            {(bestDay && quietDay) || vsAvgCopy ? (
                                <Text style={[styles.weekCaption, { color: colors.textSecondary }]}>
                                    {bestDay && quietDay && bestDay.date !== quietDay.date
                                        ? `Heaviest ${bestDay.weekday} · Lightest ${quietDay.weekday}`
                                        : bestDay
                                          ? `Most intake ${bestDay.weekday}`
                                          : ''}
                                    {vsAvgCopy
                                        ? `${bestDay && quietDay ? ' · ' : ''}${vsAvgCopy}`
                                        : ''}
                                </Text>
                            ) : null}

                            <Text
                                style={[
                                    styles.sectionLabel,
                                    { color: colors.textSecondary, marginTop: 16 },
                                ]}
                            >
                                Snapshot
                            </Text>
                            <View style={styles.bentoGrid}>
                                <BentoTile
                                    tileIndex={0}
                                    enableMotion={motionOn}
                                    icon="calendar-outline"
                                    label="7-day total"
                                    value={`${Math.round(sum7Mg)} mg`}
                                    hint={`${totalDoses7} drink${totalDoses7 !== 1 ? 's' : ''}`}
                                    colors={colors}
                                    theme={theme}
                                />
                                <BentoTile
                                    tileIndex={1}
                                    enableMotion={motionOn}
                                    icon="stats-chart-outline"
                                    label="Avg / day"
                                    value={
                                        daysWithIntake.length
                                            ? `${Math.round(avgMgPerDayActive)} mg`
                                            : '—'
                                    }
                                    hint={
                                        daysWithIntake.length
                                            ? `${daysWithIntake.length} active days`
                                            : 'No drinks'
                                    }
                                    colors={colors}
                                    theme={theme}
                                />
                                <BentoTile
                                    tileIndex={2}
                                    enableMotion={motionOn}
                                    icon="water-outline"
                                    label="Avg / drink"
                                    value={
                                        totalDoses7 > 0
                                            ? `${Math.round(avgMgPerDrink7)} mg`
                                            : '—'
                                    }
                                    hint="Rolling 7 days"
                                    colors={colors}
                                    theme={theme}
                                />
                                <BentoTile
                                    tileIndex={3}
                                    enableMotion={motionOn}
                                    icon="flash-outline"
                                    label="Peak energy"
                                    value={
                                        peakTime <= now + 5 * 60 * 1000
                                            ? 'Now'
                                            : format(new Date(peakTime), timeFmt)
                                    }
                                    hint="Next ~6h window"
                                    colors={colors}
                                    theme={theme}
                                />
                                <BentoTile
                                    tileIndex={4}
                                    enableMotion={motionOn}
                                    icon="moon-outline"
                                    label="Sleep threshold"
                                    value={isClear ? 'Clear' : format(new Date(clearanceTime), timeFmt)}
                                    hint={`Goal < ${sleepThreshold} mg`}
                                    colors={colors}
                                    theme={theme}
                                />
                                <BentoTile
                                    tileIndex={5}
                                    enableMotion={motionOn}
                                    icon="flask-outline"
                                    label="Half-life"
                                    value={`${effectiveHalfLife.toFixed(1)} h`}
                                    hint={`Weight ${weightKg} kg`}
                                    colors={colors}
                                    theme={theme}
                                />
                            </View>
                        </View>
                    </FadeInSlot>

                    <FadeInSlot slotIndex={STATS_SLOTS.chart} variant="fast">
                        <GlassmorphicCard style={{ marginVertical: 8 }}>
                            {motionOn && chartBreathEntering ? (
                                <Animated.View entering={chartBreathEntering}>
                                    {trendChartBody}
                                </Animated.View>
                            ) : (
                                trendChartBody
                            )}
                        </GlassmorphicCard>
                    </FadeInSlot>

                    <FadeInSlot slotIndex={STATS_SLOTS.table} variant="fast">
                        <GlassmorphicCard style={{ marginVertical: 8 }}>
                            <View style={styles.tableHeadRow}>
                                <Text style={[styles.chartTitle, { color: colors.text, marginBottom: 0 }]}>
                                    Hourly breakdown
                                </Text>
                            </View>

                            <View style={styles.segmentRow}>
                                {(
                                    [
                                        { id: 'all' as const, label: 'All' },
                                        { id: 'past' as const, label: 'Earlier' },
                                        { id: 'future' as const, label: 'Next 12h' },
                                    ] as const
                                ).map(seg => (
                                    <HourlySegmentChip
                                        key={seg.id}
                                        label={seg.label}
                                        selected={hourlyFilter === seg.id}
                                        onPress={() => setHourlyFilter(seg.id)}
                                        colors={colors}
                                        theme={theme}
                                        enableMotion={motionOn}
                                    />
                                ))}
                            </View>

                            <View
                                style={[
                                    styles.tableRow,
                                    styles.tableHeader,
                                    { borderBottomColor: tableBorder },
                                ]}
                            >
                                <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>
                                    Time
                                </Text>
                                <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>
                                    Level
                                </Text>
                                <Text
                                    style={[
                                        styles.tableHeaderText,
                                        styles.statusCol,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    Status
                                </Text>
                            </View>

                            {visibleHourly.map((entry, i) => {
                                const rowEl = (
                                    <View
                                        style={[
                                            styles.tableRow,
                                            {
                                                backgroundColor: entry.isNow
                                                    ? theme === 'dark'
                                                        ? 'rgba(0,240,255,0.08)'
                                                        : 'rgba(0,122,255,0.08)'
                                                    : i % 2 === 1
                                                      ? zebra
                                                      : 'transparent',
                                                borderLeftWidth: entry.isNow ? 3 : 0,
                                                borderLeftColor: entry.isNow ? colors.primary : 'transparent',
                                                opacity: entry.isPast ? 0.55 : 1,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.tableTime, { color: colors.text }]}>
                                            {entry.isNow ? 'Now' : entry.time}
                                        </Text>
                                        <Text
                                            style={[styles.tableLevel, { color: colors.text }]}
                                        >
                                            {entry.level} mg
                                        </Text>
                                        <View
                                            style={[
                                                styles.statusCol,
                                                styles.statusBadge,
                                                { backgroundColor: entry.statusColor + '20' },
                                            ]}
                                        >
                                            <Text
                                                style={[styles.statusText, { color: entry.statusColor }]}
                                            >
                                                {entry.status}
                                            </Text>
                                        </View>
                                    </View>
                                );

                                const animateRow =
                                    FEATURES.UI_MOTION && !reduceMotion && i < HOUR_ROW_ANIM_CAP;
                                const key = `h${entry.hourOffset}`;

                                if (animateRow) {
                                    return (
                                        <Animated.View
                                            key={key}
                                            entering={FadeIn.delay(i * ROW_STAGGER_MS).duration(215)}
                                        >
                                            {rowEl}
                                        </Animated.View>
                                    );
                                }

                                return <View key={key}>{rowEl}</View>;
                            })}
                        </GlassmorphicCard>
                    </FadeInSlot>

                    <View style={{ height: 40 }} />
                </MainScroll>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
    },
    backButton: { padding: 8, borderRadius: 12 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { paddingHorizontal: 16 },

    heroCard: { paddingVertical: 4 },
    heroEyebrow: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    heroMg: { fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
    heroMgUnit: { fontSize: 20, fontWeight: '600' },
    heroSub: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    heroMicro: { fontSize: 13, marginTop: 6, lineHeight: 18 },
    heroDivider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },

    sectionBlock: { marginBottom: 4 },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    weekStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    weekBarCol: { flex: 1, alignItems: 'center' },
    weekBar: { width: 10, borderRadius: 4, minHeight: 4 },
    weekBarLabel: { fontSize: 10, marginTop: 6, fontWeight: '600' },
    weekCaption: { fontSize: 12, marginTop: 6, lineHeight: 17 },

    bentoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    bentoTile: {
        width: '48%',
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 12,
        marginBottom: 2,
    },
    bentoTileTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    bentoValue: { fontSize: 17, fontWeight: '800', flex: 1, fontVariant: ['tabular-nums'] },
    bentoLabel: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
    bentoHint: { fontSize: 11, marginTop: 4, opacity: 0.85 },

    chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, alignSelf: 'flex-start' },
    chartSubtitle: { fontSize: 12, marginBottom: 10, alignSelf: 'flex-start', opacity: 0.95 },
    tableHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, marginTop: 4 },

    segmentChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },

    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    tableHeader: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 8,
        marginBottom: 4,
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    tableTime: { flex: 1, fontSize: 14, fontWeight: '500' },
    tableLevel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    statusCol: { flex: 1, alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
});
