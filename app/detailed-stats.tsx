import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { calculateStackedCaffeine, calculateAlertness } from '../src/utils/math';
import { format } from 'date-fns';

// Mini chart constants
const CHART_W = 340;
const CHART_H = 180;
const PAD = { top: 20, right: 15, bottom: 30, left: 40 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

interface HourlyEntry {
    time: string;
    level: number;
    status: string;
    statusColor: string;
    isPast: boolean;
    isNow: boolean;
}

/**
 * Creates smooth Bezier curve path from points
 */
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

export default function DetailedStatsScreen() {
    const router = useRouter();
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];
    const doses = useCaffeineStore(state => state.doses);
    const sleepThreshold = useCaffeineStore(state => state.sleepThresholdMg);
    const bedtimeHour = useCaffeineStore(state => state.bedtimeHour);
    const weightKg = useCaffeineStore(state => state.weightKg);
    const sleepQuality = useCaffeineStore(state => state.sleepQuality);
    const getEffectiveHalfLife = useCaffeineStore(state => state.getEffectiveHalfLife);

    const effectiveHalfLife = getEffectiveHalfLife();
    const now = Date.now();

    // Current caffeine level - from store's single source of truth
    const currentLevel = useCaffeineStore(state => state.currentLevel);
    const storeClearanceTime = useCaffeineStore(state => state.clearanceTime);
    const qualityMultiplier = sleepQuality === 'great' ? 1.0 : sleepQuality === 'average' ? 0.8 : 0.6;

    // --- Chart Data: 12-hour forecast with dynamic lookback ---
    const chartData = useMemo(() => {
        // Dynamic start: cover oldest dose from today or default to 2h ago
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayDoses = doses.filter(d => d.timestamp >= todayStart.getTime());
        const defaultStart = now - 2 * 60 * 60 * 1000; // 2h ago
        let startTime = defaultStart;
        if (todayDoses.length > 0) {
            const oldestDoseTime = Math.min(...todayDoses.map(d => d.timestamp));
            startTime = Math.min(defaultStart, oldestDoseTime - 1 * 60 * 60 * 1000);
        }
        const endTime = now + 12 * 60 * 60 * 1000;  // 12h future
        // Scale points dynamically: ~10 min per point
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

        // Area fill
        const areaPath = linePath +
            ` L ${getX(totalPoints)} ${PAD.top + INNER_H}` +
            ` L ${getX(0)} ${PAD.top + INNER_H} Z`;

        // X-axis: hourly labels (numbers only, no am/pm)
        const hourLabels: { x: number; label: string }[] = [];
        for (let i = 0; i <= totalPoints; i++) {
            const date = new Date(points[i].t);
            if (date.getMinutes() < 10) {
                const h = date.getHours();
                const label = h === 0 ? '12' : h > 12 ? String(h - 12) : String(h);
                hourLabels.push({ x: getX(i), label });
            }
        }

        // Night zone rectangles (6PM-6AM = darker overlay)
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
        // Close any open night zone at chart end
        if (nightStart !== null) {
            nightZones.push({ x: nightStart, width: getX(totalPoints) - nightStart });
        }

        // "Now" position
        let nowIdx = 0;
        let minDiff = Infinity;
        points.forEach((p, i) => {
            const d = Math.abs(p.t - now);
            if (d < minDiff) { minDiff = d; nowIdx = i; }
        });
        const nowX = getX(nowIdx);
        const nowY = getY(points[nowIdx].level);

        // Threshold Y
        const thresholdY = getY(sleepThreshold);

        return { linePath, areaPath, hourLabels, nowX, nowY, thresholdY, maxScale, nightZones };
    }, [doses, now, effectiveHalfLife, sleepThreshold]);

    // --- Hourly Breakdown Table: past 10h to future 12h ---
    const hourlyBreakdown = useMemo(() => {
        const entries: HourlyEntry[] = [];
        for (let h = -10; h <= 12; h++) {
            const t = now + h * 60 * 60 * 1000;
            const level = calculateStackedCaffeine(doses, t, effectiveHalfLife);
            const rounded = Math.round(level);

            let status = 'Low';
            let statusColor = '#34C759';
            if (rounded > 200) { status = 'Very High'; statusColor = '#FF3B30'; }
            else if (rounded > 100) { status = 'High'; statusColor = '#FF9500'; }
            else if (rounded > sleepThreshold) { status = 'Moderate'; statusColor = '#FFD60A'; }
            else if (rounded > 20) { status = 'Descending'; statusColor = '#5856D6'; }

            // Check crash risk
            if (h > -10) {
                const prevLevel = calculateStackedCaffeine(doses, now + (h - 1) * 60 * 60 * 1000, effectiveHalfLife);
                if (prevLevel > 80 && rounded < 50) {
                    status = 'Crash Risk';
                    statusColor = '#FF3B30';
                }
            }

            entries.push({
                time: format(new Date(t), 'h:mm a'),
                level: rounded,
                status,
                statusColor,
                isPast: h < 0,
                isNow: h === 0,
            });
        }
        return entries;
    }, [doses, now, effectiveHalfLife, sleepThreshold]);

    // --- Summary Stats ---
    let peakAlertness = -Infinity;
    let peakTime = now;
    for (let t = now; t <= now + 6 * 60 * 60 * 1000; t += 5 * 60 * 1000) {
        const alertness = calculateAlertness(doses, t, effectiveHalfLife, undefined, qualityMultiplier);
        if (alertness > peakAlertness) { peakAlertness = alertness; peakTime = t; }
    }

    // Use store's shared clearance time (single source of truth)
    const isClear = storeClearanceTime === null || currentLevel <= sleepThreshold;
    const clearanceTime = storeClearanceTime ?? now;

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayDoses = doses.filter(d => d.timestamp >= todayStart.getTime());
    const totalToday = todayDoses.reduce((sum, d) => sum + d.mg, 0);

    const statCards = [
        { icon: '☕', label: `${Math.round(currentLevel)} mg`, sub: `${todayDoses.length} drink${todayDoses.length !== 1 ? 's' : ''} today (${Math.round(totalToday)} mg)`, color: '#FF6B35' },
        { icon: '⚡', label: peakTime <= now + 5 * 60 * 1000 ? 'Right now' : format(new Date(peakTime), 'h:mm a'), sub: 'Peak energy', color: '#FF9500' },
        { icon: '🌙', label: isClear ? 'Clear' : format(new Date(clearanceTime), 'h:mm a'), sub: `Below ${sleepThreshold}mg`, color: '#5856D6' },
        { icon: '🔬', label: `${effectiveHalfLife.toFixed(1)}h`, sub: `Half-life (${weightKg}kg)`, color: '#34C759' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#050505', '#1a1a1a'] : ['#F2F2F7', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>Detailed Statistics</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Quick stat row */}
                    <View style={styles.statRow}>
                        {statCards.map((s, i) => (
                            <GlassmorphicCard key={i} style={styles.miniCard} intensity={10}>
                                <Text style={styles.miniIcon}>{s.icon}</Text>
                                <Text style={[styles.miniLabel, { color: s.color }]}>{s.label}</Text>
                                <Text style={[styles.miniSub, { color: colors.textSecondary }]}>{s.sub}</Text>
                            </GlassmorphicCard>
                        ))}
                    </View>

                    {/* Detailed Chart */}
                    <GlassmorphicCard style={styles.chartCard} intensity={12}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>12-Hour Forecast</Text>
                        <Svg width={CHART_W} height={CHART_H}>
                            <Defs>
                                <SvgLinearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={colors.primary} stopOpacity={0.25} />
                                    <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
                                </SvgLinearGradient>
                            </Defs>

                            {/* Night zone overlays (behind everything) */}
                            {chartData.nightZones.map((zone, i) => (
                                <Rect
                                    key={`night-${i}`}
                                    x={zone.x}
                                    y={PAD.top}
                                    width={zone.width}
                                    height={INNER_H}
                                    fill="rgba(0,0,0,0.25)"
                                    rx={4}
                                />
                            ))}

                            {/* Area fill */}
                            <Path d={chartData.areaPath} fill="url(#detailGrad)" />

                            {/* Caffeine line */}
                            <Path
                                d={chartData.linePath}
                                stroke={colors.primary}
                                strokeWidth={2.5}
                                fill="none"
                                strokeLinecap="round"
                            />

                            {/* Threshold line */}
                            <Line
                                x1={PAD.left} y1={chartData.thresholdY}
                                x2={CHART_W - PAD.right} y2={chartData.thresholdY}
                                stroke={colors.accent} strokeWidth={1} strokeDasharray="5,3" strokeOpacity={0.5}
                            />
                            <SvgText
                                x={CHART_W - PAD.right - 2} y={chartData.thresholdY - 4}
                                fill={colors.accent} fontSize={8} textAnchor="end" opacity={0.6}
                            >
                                Sleep {sleepThreshold}mg
                            </SvgText>

                            {/* Now vertical line */}
                            <Line
                                x1={chartData.nowX} y1={PAD.top}
                                x2={chartData.nowX} y2={PAD.top + INNER_H}
                                stroke={colors.primary} strokeWidth={1.5} strokeDasharray="3,3" strokeOpacity={0.5}
                            />
                            <Circle cx={chartData.nowX} cy={chartData.nowY} r={5} fill={colors.primary} opacity={0.3} />
                            <Circle cx={chartData.nowX} cy={chartData.nowY} r={3} fill={colors.primary} />

                            {/* X-axis hourly labels */}
                            {chartData.hourLabels.map((lab, i) => (
                                <SvgText
                                    key={i} x={lab.x} y={PAD.top + INNER_H + 16}
                                    fill={colors.textSecondary} fontSize={9} textAnchor="middle" opacity={0.6}
                                >
                                    {lab.label}
                                </SvgText>
                            ))}
                        </Svg>
                    </GlassmorphicCard>

                    {/* Hourly Breakdown Table */}
                    <GlassmorphicCard style={styles.tableCard} intensity={12}>
                        <Text style={[styles.chartTitle, { color: colors.text }]}>Hourly Breakdown</Text>

                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>Time</Text>
                            <Text style={[styles.tableHeaderText, { color: colors.textSecondary }]}>Level</Text>
                            <Text style={[styles.tableHeaderText, styles.statusCol, { color: colors.textSecondary }]}>Status</Text>
                        </View>

                        {/* Table Rows */}
                        {hourlyBreakdown.map((entry, i) => (
                            <View
                                key={i}
                                style={[styles.tableRow, {
                                    backgroundColor: entry.isNow
                                        ? (theme === 'dark' ? 'rgba(0,240,255,0.08)' : 'rgba(0,122,255,0.08)')
                                        : 'transparent',
                                    borderLeftWidth: entry.isNow ? 3 : 0,
                                    borderLeftColor: entry.isNow ? colors.primary : 'transparent',
                                    opacity: entry.isPast ? 0.5 : 1,
                                }]}
                            >
                                <Text style={[styles.tableTime, { color: colors.text }]}>
                                    {entry.isNow ? '▸ Now' : entry.time}
                                </Text>
                                <Text style={[styles.tableLevel, { color: colors.text }]}>
                                    {entry.level} mg
                                </Text>
                                <View style={[styles.statusCol, styles.statusBadge, { backgroundColor: entry.statusColor + '20' }]}>
                                    <Text style={[styles.statusText, { color: entry.statusColor }]}>
                                        {entry.status}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </GlassmorphicCard>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15,
    },
    backButton: { padding: 8, borderRadius: 12 },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { paddingHorizontal: 16 },

    // Quick stat row
    statRow: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between', marginBottom: 12,
    },
    miniCard: { width: '48%', marginBottom: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    miniIcon: { fontSize: 22, marginBottom: 4, textAlign: 'center' },
    miniLabel: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
    miniSub: { fontSize: 11, marginTop: 2, textAlign: 'center' },

    // Chart
    chartCard: { marginBottom: 12, alignItems: 'center' },
    chartTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, alignSelf: 'flex-start' },

    // Table
    tableCard: { marginBottom: 12 },
    tableRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: 8,
        borderRadius: 8,
    },
    tableHeader: {
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
        paddingBottom: 8, marginBottom: 4,
    },
    tableHeaderText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
    tableTime: { flex: 1, fontSize: 14, fontWeight: '500' },
    tableLevel: { flex: 1, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
    statusCol: { flex: 1, alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
});
