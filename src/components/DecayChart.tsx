import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, ScrollView } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { format, subDays, startOfDay } from 'date-fns';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH_PER_DAY = SCREEN_WIDTH - 60; // One "page" width for snap
const CHART_HEIGHT = 200;
const PADDING = { top: 25, right: 20, bottom: 40, left: 45 };

// Alertness curve color (orange/amber)
const ALERTNESS_COLOR = '#FF9500';
const WARNING_COLOR = '#FF3B30'; // Red for caffeine during sleep zone

/**
 * Creates a smooth Bezier curve path from points using monotone cubic
 * Hermite interpolation (Fritsch-Carlson). This prevents overshoot and
 * undershoot, so the curve never dips below zero before a spike.
 *
 * @param points  Array of {x, y} pixel coordinates.
 * @param yMax    Maximum Y pixel value (bottom of chart area). Control
 *                points are clamped so the curve never exceeds this.
 */
const createSmoothPath = (
    points: { x: number; y: number }[],
    yMax?: number,
): string => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    const n = points.length;

    // 1. Compute slopes (deltas) between successive points
    const dx: number[] = [];
    const dy: number[] = [];
    const m: number[] = []; // tangents

    for (let i = 0; i < n - 1; i++) {
        dx.push(points[i + 1].x - points[i].x);
        dy.push(points[i + 1].y - points[i].y);
    }

    const slopes: number[] = dx.map((d, i) => (d === 0 ? 0 : dy[i] / d));

    // 2. Compute initial tangents using averages of successive slopes
    m.push(slopes[0]);
    for (let i = 1; i < n - 1; i++) {
        if (slopes[i - 1] * slopes[i] <= 0) {
            // Sign change or zero — flat tangent prevents overshoot
            m.push(0);
        } else {
            m.push((slopes[i - 1] + slopes[i]) / 2);
        }
    }
    m.push(slopes[slopes.length - 1]);

    // 3. Fritsch-Carlson monotonicity correction
    for (let i = 0; i < n - 1; i++) {
        if (slopes[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
        } else {
            const alpha = m[i] / slopes[i];
            const beta = m[i + 1] / slopes[i];
            // Restrict to a circle of radius 3 to guarantee monotonicity
            const mag = Math.sqrt(alpha * alpha + beta * beta);
            if (mag > 3) {
                const tau = 3 / mag;
                m[i] = tau * alpha * slopes[i];
                m[i + 1] = tau * beta * slopes[i];
            }
        }
    }

    // 4. Build SVG cubic Bézier path with optional Y clamping
    const clampY = (val: number) =>
        yMax !== undefined ? Math.min(val, yMax) : val;

    let path = `M ${points[0].x} ${clampY(points[0].y)}`;

    for (let i = 0; i < n - 1; i++) {
        const segDx = dx[i];
        const cp1x = points[i].x + segDx / 3;
        const cp1y = clampY(points[i].y + (m[i] * segDx) / 3);
        const cp2x = points[i + 1].x - segDx / 3;
        const cp2y = clampY(points[i + 1].y - (m[i + 1] * segDx) / 3);

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${clampY(points[i + 1].y)}`;
    }

    return path;
};

interface DecayChartProps {
    showCaffeine?: boolean;
    showAlertness?: boolean;
    showThreshold?: boolean;
}

export const DecayChart: React.FC<DecayChartProps> = ({
    showCaffeine = true,
    showAlertness = true,
    showThreshold = false
}) => {
    const doses = useCaffeineStore(state => state.doses);
    const getChartData = useCaffeineStore(state => state.getChartData);
    const getAlertnessData = useCaffeineStore(state => state.getAlertnessData);
    const sleepThreshold = useCaffeineStore(state => state.sleepThresholdMg);
    const bedtimeHour = useCaffeineStore(state => state.bedtimeHour);
    const theme = useCaffeineStore(state => state.theme);
    const use24HourFormat = useCaffeineStore(state => state.use24HourFormat);
    const colors = Colors[theme];

    const scrollRef = useRef<ScrollView>(null);

    // --- Determine how many past days have data ---
    const visibleDays = useMemo(() => {
        const now = new Date();
        const yesterdayStart = startOfDay(subDays(now, 1)).getTime();
        const yesterdayEnd = startOfDay(now).getTime();
        const dayBeforeStart = startOfDay(subDays(now, 2)).getTime();
        const dayBeforeEnd = yesterdayStart;

        const hasYesterday = doses.some(d => d.timestamp >= yesterdayStart && d.timestamp < yesterdayEnd);
        const hasDayBefore = doses.some(d => d.timestamp >= dayBeforeStart && d.timestamp < dayBeforeEnd);

        if (hasDayBefore && hasYesterday) return 3;
        if (hasYesterday) return 2;
        return 1;
    }, [doses]);

    const totalChartWidth = CHART_WIDTH_PER_DAY * visibleDays;

    // Dynamic lookback: for single-day view, check if any doses are older than 2h
    const lookbackHours = useMemo(() => {
        if (visibleDays === 2) return 26;
        if (visibleDays === 3) return 50;
        // Single day: find oldest dose from today
        const now = Date.now();
        const todayStart = startOfDay(new Date(now)).getTime();
        const todayDoses = doses.filter(d => d.timestamp >= todayStart);
        if (todayDoses.length > 0) {
            const oldestDoseTime = Math.min(...todayDoses.map(d => d.timestamp));
            const hoursToOldest = (now - oldestDoseTime) / (1000 * 60 * 60);
            return Math.max(2, Math.ceil(hoursToOldest) + 1);
        }
        return 2;
    }, [visibleDays, doses]);

    // Scroll to "today" (far right) on mount
    useEffect(() => {
        if (visibleDays > 1) {
            const timer = setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: false });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [visibleDays]);

    const chartData = useMemo(() => {
        const caffeinePoints = getChartData(lookbackHours, 10);
        const alertnessPoints = getAlertnessData(lookbackHours, 10);

        if (caffeinePoints.length === 0) {
            return null;
        }

        const caffeineValues = caffeinePoints.map(p => p.value);
        const maxCaffeine = Math.max(...caffeineValues, sleepThreshold, 100);
        const maxCaffeineScaled = Math.ceil(maxCaffeine / 50) * 50 + 50;
        const maxAlertness = 120;

        const innerWidth = totalChartWidth - PADDING.left - PADDING.right;
        const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

        const getX = (index: number) => PADDING.left + (index / (caffeinePoints.length - 1)) * innerWidth;
        const getCaffeineY = (value: number) => PADDING.top + innerHeight - (value / maxCaffeineScaled) * innerHeight;
        const getAlertnessY = (value: number) => PADDING.top + innerHeight - (value / maxAlertness) * innerHeight;

        // === SLEEP ZONE DETECTION ===
        const now = Date.now();
        const today = new Date(now);
        today.setHours(bedtimeHour, 0, 0, 0);
        let bedtime = today.getTime();
        if (bedtime < now) {
            bedtime += 24 * 60 * 60 * 1000;
        }

        const sleepZoneStart = bedtime - (2 * 60 * 60 * 1000);
        const sleepZoneEnd = bedtime + (8 * 60 * 60 * 1000);

        const isInSleepZone = (timestamp: number) => {
            const hour = new Date(timestamp).getHours();
            const sleepStartHour = (bedtimeHour - 2 + 24) % 24;
            const sleepEndHour = (bedtimeHour + 8) % 24;

            if (sleepStartHour < sleepEndHour) {
                return hour >= sleepStartHour && hour < sleepEndHour;
            } else {
                return hour >= sleepStartHour || hour < sleepEndHour;
            }
        };

        // Build caffeine path (split into normal and warning segments)
        const caffeinePathPoints = caffeinePoints.map((p, i) => ({
            x: getX(i),
            y: getCaffeineY(p.value),
            isWarning: isInSleepZone(p.date) && p.value > sleepThreshold,
        }));

        let normalSegments: { x: number; y: number }[][] = [];
        let warningSegments: { x: number; y: number }[][] = [];
        let currentSegment: { x: number; y: number }[] = [];
        let currentlyInWarning = caffeinePathPoints[0]?.isWarning || false;

        caffeinePathPoints.forEach((point, i) => {
            if (i === 0) {
                currentSegment.push({ x: point.x, y: point.y });
            } else if (point.isWarning === currentlyInWarning) {
                currentSegment.push({ x: point.x, y: point.y });
            } else {
                currentSegment.push({ x: point.x, y: point.y });
                if (currentlyInWarning) {
                    warningSegments.push([...currentSegment]);
                } else {
                    normalSegments.push([...currentSegment]);
                }
                currentSegment = [{ x: point.x, y: point.y }];
                currentlyInWarning = point.isWarning;
            }
        });

        if (currentSegment.length > 0) {
            if (currentlyInWarning) {
                warningSegments.push(currentSegment);
            } else {
                normalSegments.push(currentSegment);
            }
        }

        const chartBottom = PADDING.top + innerHeight;
        const normalCaffeinePath = normalSegments.map(seg => createSmoothPath(seg, chartBottom)).join(' ');
        const warningCaffeinePath = warningSegments.map(seg => createSmoothPath(seg, chartBottom)).join(' ');

        // Build area fill path
        const areaPoints = caffeinePathPoints.map(p => ({ x: p.x, y: p.y }));
        let caffeineArea = createSmoothPath(areaPoints, chartBottom);
        caffeineArea += ` L ${areaPoints[areaPoints.length - 1].x} ${chartBottom} L ${areaPoints[0].x} ${chartBottom} Z`;

        // Build alertness path with sleep zone clamping
        const alertnessPathPoints = alertnessPoints.map((p, i) => {
            const inSleep = isInSleepZone(p.date);
            const clampedValue = inSleep ? Math.min(p.value, 0) : p.value;
            return {
                x: getX(i),
                y: getAlertnessY(clampedValue),
            };
        });
        const alertnessPath = createSmoothPath(alertnessPathPoints, chartBottom);

        // X-axis labels: every hour + "Now" marker
        const labels: { x: number; label: string; isNow?: boolean }[] = [];

        // Find "Now" point
        let nowIndex = 0;
        let minDiff = Infinity;
        caffeinePoints.forEach((p, i) => {
            const diff = Math.abs(p.date - now);
            if (diff < minDiff) { minDiff = diff; nowIndex = i; }
        });
        const nowX = getX(nowIndex);

        labels.push({ x: nowX, label: 'Now', isNow: true });

        // Hour labels — compute directly from the chart time range
        // (data points are at 30-min intervals from arbitrary start, so they never land on :00)
        const chartFirstTime = caffeinePoints[0].date;
        const chartLastTime = caffeinePoints[caffeinePoints.length - 1].date;
        const chartTimeRange = chartLastTime - chartFirstTime;

        const hourLabels: { x: number; label: string }[] = [];
        // Find the first whole hour at or after chartFirstTime
        const firstHour = new Date(chartFirstTime);
        firstHour.setMinutes(0, 0, 0);
        if (firstHour.getTime() < chartFirstTime) {
            firstHour.setHours(firstHour.getHours() + 1);
        }

        for (let t = firstHour.getTime(); t <= chartLastTime; t += 60 * 60 * 1000) {
            const ratio = (t - chartFirstTime) / chartTimeRange;
            const labelX = PADDING.left + ratio * innerWidth;
            const tooCloseToNow = Math.abs(labelX - nowX) < 25;
            const tooCloseToEdge = labelX < PADDING.left + 15 || labelX > totalChartWidth - PADDING.right - 15;
            if (!tooCloseToNow && !tooCloseToEdge) {
                const h = new Date(t).getHours();
                let label: string;
                if (use24HourFormat) {
                    label = h.toString();
                } else {
                    const h12 = h % 12 === 0 ? 12 : h % 12;
                    const suffix = h >= 12 ? 'p' : 'a';
                    label = `${h12}${suffix}`;
                }
                hourLabels.push({ x: labelX, label });
            }
        }

        // Remove hour labels that are too close to each other (< 20px)
        const filteredHourLabels: { x: number; label: string }[] = [];
        for (const hl of hourLabels) {
            const tooClose = filteredHourLabels.some(prev => Math.abs(prev.x - hl.x) < 20);
            if (!tooClose) {
                filteredHourLabels.push(hl);
            }
        }
        filteredHourLabels.forEach(hl => labels.push(hl));

        // Day separator lines + labels (only for multi-day views)
        const dayMarkers: { x: number; label: string }[] = [];
        if (visibleDays > 1) {
            for (let d = 0; d < visibleDays; d++) {
                const dayStart = startOfDay(subDays(new Date(), visibleDays - 1 - d));
                let bestIdx = 0;
                let bestDiff = Infinity;
                caffeinePoints.forEach((p, i) => {
                    const diff = Math.abs(p.date - dayStart.getTime());
                    if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
                });
                const markerX = getX(bestIdx);
                if (markerX > PADDING.left + 5 && markerX < totalChartWidth - PADDING.right - 5) {
                    dayMarkers.push({
                        x: markerX,
                        label: d === visibleDays - 1 ? 'Today' : d === visibleDays - 2 ? 'Yesterday' : format(dayStart, 'EEE, MMM d'),
                    });
                }
            }
        }

        // Sleep zone visual coordinates
        const firstTime = caffeinePoints[0].date;
        const lastTime = caffeinePoints[caffeinePoints.length - 1].date;
        const timeRange = lastTime - firstTime;

        let sleepZoneX = null;
        let sleepZoneWidth = null;

        if (sleepZoneStart < lastTime && sleepZoneEnd > firstTime) {
            const zoneStartClamped = Math.max(sleepZoneStart, firstTime);
            const zoneEndClamped = Math.min(sleepZoneEnd, lastTime);
            const startRatio = (zoneStartClamped - firstTime) / timeRange;
            const endRatio = (zoneEndClamped - firstTime) / timeRange;
            sleepZoneX = PADDING.left + startRatio * innerWidth;
            sleepZoneWidth = (endRatio - startRatio) * innerWidth;
        }

        // Now caffeine Y for glowing dot
        const nowCaffeineVal = caffeinePoints[nowIndex]?.value ?? 0;
        const nowCaffeineY = getCaffeineY(nowCaffeineVal);

        return {
            normalCaffeinePath,
            warningCaffeinePath,
            caffeineArea,
            alertnessPath,
            maxCaffeine: maxCaffeineScaled,
            xLabels: labels,
            thresholdY: getCaffeineY(sleepThreshold),
            innerHeight,
            sleepZoneX,
            sleepZoneWidth,
            nowX,
            nowCaffeineY,
            dayMarkers,
        };
    }, [doses, getChartData, getAlertnessData, sleepThreshold, bedtimeHour, visibleDays, totalChartWidth, lookbackHours, use24HourFormat]);

    if (doses.length === 0 || !chartData) {
        return (
            <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    Add a drink to see your forecast
                </Text>
            </View>
        );
    }

    const scrollEnabled = visibleDays > 1;

    return (
        <View style={styles.container}>
            <View style={styles.timeHeader}>
                <Text style={[styles.timeHeaderText, { color: colors.textSecondary }]}>
                    {format(new Date(), 'MMM d')} • Now: {format(new Date(), 'h:mm a')}
                </Text>
                {scrollEnabled && (
                    <Text style={[styles.scrollHint, { color: colors.textSecondary }]}>
                        ← Swipe for history
                    </Text>
                )}
            </View>

            <ScrollView
                ref={scrollRef}
                horizontal
                scrollEnabled={scrollEnabled}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={CHART_WIDTH_PER_DAY}
                snapToAlignment="end"
                contentContainerStyle={{ width: totalChartWidth }}
            >
                <Svg width={totalChartWidth} height={CHART_HEIGHT}>
                    <Defs>
                        {/* Caffeine gradient */}
                        <LinearGradient id="caffeineGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.5" />
                            <Stop offset="50%" stopColor={colors.primary} stopOpacity="0.2" />
                            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.01" />
                        </LinearGradient>

                        {/* Alertness gradient */}
                        <LinearGradient id="alertnessGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor={ALERTNESS_COLOR} stopOpacity="0.35" />
                            <Stop offset="100%" stopColor={ALERTNESS_COLOR} stopOpacity="0.01" />
                        </LinearGradient>

                        {/* Sleep zone gradient */}
                        <LinearGradient id="sleepZoneGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor="#5856D6" stopOpacity="0.2" />
                            <Stop offset="50%" stopColor="#5856D6" stopOpacity="0.12" />
                            <Stop offset="100%" stopColor="#5856D6" stopOpacity="0.03" />
                        </LinearGradient>
                    </Defs>

                    {/* Day separator lines (multi-day only) */}
                    {chartData.dayMarkers.map((marker, idx) => (
                        <React.Fragment key={`day-${idx}`}>
                            <Line
                                x1={marker.x}
                                y1={PADDING.top}
                                x2={marker.x}
                                y2={PADDING.top + chartData.innerHeight}
                                stroke={colors.border}
                                strokeWidth={1}
                                strokeDasharray="6,4"
                                strokeOpacity={0.3}
                            />
                            <SvgText
                                x={marker.x + 6}
                                y={PADDING.top + 12}
                                fill={colors.textSecondary}
                                fontSize={9}
                                fontWeight="600"
                                opacity={0.5}
                            >
                                {marker.label}
                            </SvgText>
                        </React.Fragment>
                    ))}

                    {/* Sleep Zone Background */}
                    {chartData.sleepZoneX !== null && chartData.sleepZoneWidth !== null && (
                        <>
                            <Rect
                                x={chartData.sleepZoneX}
                                y={PADDING.top}
                                width={chartData.sleepZoneWidth}
                                height={chartData.innerHeight}
                                fill="url(#sleepZoneGradient)"
                            />
                            <SvgText
                                x={chartData.sleepZoneX + 8}
                                y={PADDING.top + 15}
                                fill={theme === 'dark' ? '#FFFFFF' : '#5856D6'}
                                fontSize={11}
                                fontWeight="600"
                                opacity={0.5}
                            >
                                Bedtime
                            </SvgText>
                        </>
                    )}

                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4].map(i => {
                        const value = Math.round((chartData.maxCaffeine / 4) * (4 - i));
                        const y = PADDING.top + (chartData.innerHeight / 4) * i;
                        return (
                            <React.Fragment key={i}>
                                <Line
                                    x1={PADDING.left}
                                    y1={y}
                                    x2={totalChartWidth - PADDING.right}
                                    y2={y}
                                    stroke={colors.border}
                                    strokeWidth={0.5}
                                    strokeOpacity={i === 4 ? 0.25 : 0.12}
                                    strokeDasharray={i === 4 ? "0" : "2,3"}
                                />
                                {/* Y-axis label at each day snap boundary */}
                                {Array.from({ length: visibleDays }).map((_, d) => (
                                    <SvgText
                                        key={`y-${i}-${d}`}
                                        x={PADDING.left - 8 + d * CHART_WIDTH_PER_DAY}
                                        y={y + 4}
                                        fill={colors.textSecondary}
                                        fontSize={9}
                                        textAnchor="end"
                                        opacity={0.7}
                                    >
                                        {value}
                                    </SvgText>
                                ))}
                            </React.Fragment>
                        );
                    })}

                    {/* Caffeine area fill */}
                    {showCaffeine && <Path d={chartData.caffeineArea} fill="url(#caffeineGradient)" />}

                    {/* Alertness line */}
                    {showAlertness && (
                        <Path
                            d={chartData.alertnessPath}
                            stroke={ALERTNESS_COLOR}
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={0.95}
                        />
                    )}

                    {/* Normal caffeine line (blue) */}
                    {showCaffeine && chartData.normalCaffeinePath && (
                        <Path
                            d={chartData.normalCaffeinePath}
                            stroke={colors.primary}
                            strokeWidth={3.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Warning caffeine line (red during sleep zone) */}
                    {showCaffeine && chartData.warningCaffeinePath && (
                        <Path
                            d={chartData.warningCaffeinePath}
                            stroke={WARNING_COLOR}
                            strokeWidth={3.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Sleep threshold line */}
                    {showThreshold && (
                        <>
                            <Line
                                x1={PADDING.left}
                                y1={chartData.thresholdY}
                                x2={totalChartWidth - PADDING.right}
                                y2={chartData.thresholdY}
                                stroke={colors.accent}
                                strokeWidth={1.5}
                                strokeDasharray="6,4"
                                strokeOpacity={0.5}
                            />
                            <SvgText
                                x={totalChartWidth - PADDING.right - 5}
                                y={chartData.thresholdY - 6}
                                fill={colors.accent}
                                fontSize={9}
                                textAnchor="end"
                                opacity={0.7}
                            >
                                Sleep {sleepThreshold}mg
                            </SvgText>
                        </>
                    )}

                    {/* X-axis labels (time) */}
                    {chartData.xLabels.map((label, idx) => (
                        <SvgText
                            key={idx}
                            x={label.x}
                            y={PADDING.top + chartData.innerHeight + 20}
                            fill={label.isNow ? colors.primary : colors.textSecondary}
                            fontSize={label.isNow ? 11 : 10}
                            textAnchor="middle"
                            opacity={label.isNow ? 1 : 0.5}
                            fontWeight={label.isNow ? '700' : '400'}
                        >
                            {label.label}
                        </SvgText>
                    ))}

                    {/* "Now" vertical indicator line */}
                    <Line
                        x1={chartData.nowX}
                        y1={PADDING.top}
                        x2={chartData.nowX}
                        y2={PADDING.top + chartData.innerHeight}
                        stroke={colors.primary}
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                        strokeOpacity={0.6}
                    />
                    {/* Glowing dot on caffeine curve at Now */}
                    {showCaffeine && (
                        <>
                            <Circle
                                cx={chartData.nowX}
                                cy={chartData.nowCaffeineY}
                                r={8}
                                fill={colors.primary}
                                opacity={0.2}
                            />
                            <Circle
                                cx={chartData.nowX}
                                cy={chartData.nowCaffeineY}
                                r={4}
                                fill={colors.primary}
                                opacity={0.9}
                            />
                        </>
                    )}
                </Svg>
            </ScrollView>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Caffeine (mg)</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendLine, { backgroundColor: ALERTNESS_COLOR }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Alertness</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDashed, { borderColor: colors.accent }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Sleep</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        alignItems: 'center',
    },
    timeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
        marginBottom: 8,
    },
    timeHeaderText: {
        fontSize: 11,
        fontWeight: '500',
    },
    scrollHint: {
        fontSize: 10,
        fontStyle: 'italic',
        opacity: 0.5,
    },
    emptyContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 20,
        borderStyle: 'dashed',
        marginHorizontal: 20,
    },
    emptyText: {
        fontSize: 14,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 10,
        flexWrap: 'wrap',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendLine: {
        width: 12,
        height: 3,
        borderRadius: 2,
    },
    legendDashed: {
        width: 12,
        height: 0,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    legendText: {
        fontSize: 9,
    },
});
