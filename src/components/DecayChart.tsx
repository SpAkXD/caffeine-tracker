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
 * Creates smooth Bezier curve path from points
 * Uses Catmull-Rom to Bezier conversion for natural curves
 */
const createSmoothPath = (points: { x: number; y: number }[]): string => {
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
    const lookbackHours = visibleDays === 1 ? 2 : visibleDays === 2 ? 26 : 50;

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

        const normalCaffeinePath = normalSegments.map(seg => createSmoothPath(seg)).join(' ');
        const warningCaffeinePath = warningSegments.map(seg => createSmoothPath(seg)).join(' ');

        // Build area fill path
        const areaPoints = caffeinePathPoints.map(p => ({ x: p.x, y: p.y }));
        let caffeineArea = createSmoothPath(areaPoints);
        caffeineArea += ` L ${areaPoints[areaPoints.length - 1].x} ${PADDING.top + innerHeight} L ${areaPoints[0].x} ${PADDING.top + innerHeight} Z`;

        // Build alertness path with sleep zone clamping
        const alertnessPathPoints = alertnessPoints.map((p, i) => {
            const inSleep = isInSleepZone(p.date);
            const clampedValue = inSleep ? Math.min(p.value, 0) : p.value;
            return {
                x: getX(i),
                y: getAlertnessY(clampedValue),
            };
        });
        const alertnessPath = createSmoothPath(alertnessPathPoints);

        // X-axis labels: every 3 hours + "Now" marker
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

        // Time labels every 3 hours
        caffeinePoints.forEach((p, i) => {
            const date = new Date(p.date);
            if (date.getMinutes() === 0 && date.getHours() % 3 === 0) {
                const labelX = getX(i);
                const tooCloseToNow = Math.abs(labelX - nowX) < 30;
                const tooCloseToEdge = labelX < PADDING.left + 15 || labelX > totalChartWidth - PADDING.right - 15;
                if (!tooCloseToNow && !tooCloseToEdge) {
                    labels.push({
                        x: labelX,
                        label: format(p.date, 'ha').toLowerCase()
                    });
                }
            }
        });

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
    }, [doses, getChartData, getAlertnessData, sleepThreshold, bedtimeHour, visibleDays, totalChartWidth, lookbackHours]);

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
                            opacity={label.isNow ? 1 : 0.6}
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
