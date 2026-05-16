import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '../src/components/PressableScale';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';
import { recommendDoses, formatDrinkInLabel, DoseRecommendation } from '../src/utils/doseAdvisor';

const TARGET_OPTIONS = [
    { label: '1h', ms: 60 * 60 * 1000 },
    { label: '2h', ms: 2 * 60 * 60 * 1000 },
    { label: '3h', ms: 3 * 60 * 60 * 1000 },
    { label: '4h', ms: 4 * 60 * 60 * 1000 },
];

const ALERTNESS_OPTIONS = [
    { label: 'Moderate', value: 60 },
    { label: 'Focused', value: 80 },
    { label: 'Peak', value: 100 },
];

export default function DoseAdvisor() {
    const router = useRouter();
    const theme = useCaffeineStore((s) => s.theme);
    const doses = useCaffeineStore((s) => s.doses);
    const halfLifeHours = useCaffeineStore((s) => s.getEffectiveHalfLife());
    const sleepThresholdMg = useCaffeineStore((s) => s.sleepThresholdMg);
    const bedtimeHour = useCaffeineStore((s) => s.bedtimeHour);
    const colors = Colors[theme];

    const [targetOffset, setTargetOffset] = useState(TARGET_OPTIONS[1]);
    const [targetAlertness, setTargetAlertness] = useState(ALERTNESS_OPTIONS[1]);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<DoseRecommendation[] | null>(null);

    const bedtimeMs = useMemo(() => {
        const now = new Date();
        const bed = new Date(now);
        bed.setHours(bedtimeHour, 0, 0, 0);
        if (bed.getTime() <= Date.now()) bed.setDate(bed.getDate() + 1);
        return bed.getTime();
    }, [bedtimeHour]);

    const handleCalculate = () => {
        setLoading(true);
        // Run on next tick so UI can update
        setTimeout(() => {
            const now = Date.now();
            const targetTime = now + targetOffset.ms;
            const recs = recommendDoses(
                targetTime,
                targetAlertness.value,
                doses,
                halfLifeHours,
                sleepThresholdMg,
                bedtimeMs,
                now
            );
            setResults(recs);
            setLoading(false);
        }, 50);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#050505', '#0c1018', '#1a1a1a'] : ['#F2F2F7', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <PressableScale onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </PressableScale>
                    <Text style={[styles.title, { color: colors.text }]}>Dose Advisor</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        When should I drink coffee to feel my best?
                    </Text>

                    {/* Target time */}
                    <GlassmorphicCard>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            I want to feel great in…
                        </Text>
                        <View style={styles.chipRow}>
                            {TARGET_OPTIONS.map((opt) => (
                                <PressableScale
                                    key={opt.label}
                                    onPress={() => { setTargetOffset(opt); setResults(null); }}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor:
                                                targetOffset.label === opt.label
                                                    ? colors.primary
                                                    : colors.primary + '22',
                                            borderColor:
                                                targetOffset.label === opt.label
                                                    ? colors.primary
                                                    : colors.primary + '44',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color:
                                                    targetOffset.label === opt.label ? '#000' : colors.primary,
                                            },
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </PressableScale>
                            ))}
                        </View>
                    </GlassmorphicCard>

                    {/* Target alertness */}
                    <GlassmorphicCard>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            Target energy level…
                        </Text>
                        <View style={styles.chipRow}>
                            {ALERTNESS_OPTIONS.map((opt) => (
                                <PressableScale
                                    key={opt.label}
                                    onPress={() => { setTargetAlertness(opt); setResults(null); }}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor:
                                                targetAlertness.label === opt.label
                                                    ? colors.primary
                                                    : colors.primary + '22',
                                            borderColor:
                                                targetAlertness.label === opt.label
                                                    ? colors.primary
                                                    : colors.primary + '44',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color:
                                                    targetAlertness.label === opt.label
                                                        ? '#000'
                                                        : colors.primary,
                                            },
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </PressableScale>
                            ))}
                        </View>
                    </GlassmorphicCard>

                    {/* Calculate button */}
                    <PressableScale
                        style={[styles.calcButton, { backgroundColor: colors.primary }]}
                        onPress={handleCalculate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.calcText}>Calculate</Text>
                        )}
                    </PressableScale>

                    {/* Results */}
                    {results && results.length === 0 && (
                        <GlassmorphicCard>
                            <Text style={[styles.noResults, { color: colors.textSecondary }]}>
                                You're already on track! No extra caffeine needed right now.
                            </Text>
                        </GlassmorphicCard>
                    )}

                    {results && results.length > 0 && (
                        <>
                            <Text style={[styles.resultsHeader, { color: colors.text }]}>Top Recommendations</Text>
                            {results.map((rec, idx) => (
                                <GlassmorphicCard key={idx}>
                                    <View style={styles.recRow}>
                                        <View style={[styles.recBadge, { backgroundColor: colors.primary + '22' }]}>
                                            <Text style={[styles.recRank, { color: colors.primary }]}>#{idx + 1}</Text>
                                        </View>
                                        <View style={styles.recBody}>
                                            <Text style={[styles.recMain, { color: colors.text }]}>
                                                {rec.mg} mg  ·  {formatDrinkInLabel(rec.drinkAt)}
                                            </Text>
                                            <Text style={[styles.recSub, { color: colors.textSecondary }]}>
                                                Predicted alertness: {rec.predictedAlertness}/120
                                                {rec.sleepPenaltyHours > 0
                                                    ? `  ·  Sleep delay: +${rec.sleepPenaltyHours}h`
                                                    : '  ·  Sleep unaffected'}
                                            </Text>
                                        </View>
                                    </View>
                                </GlassmorphicCard>
                            ))}
                            <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                                Based on your current doses and body settings. Always listen to your body.
                            </Text>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 60,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 12,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    chip: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    calcButton: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginVertical: 8,
    },
    calcText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    resultsHeader: {
        fontSize: 17,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
    },
    recRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
    },
    recBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recRank: {
        fontSize: 14,
        fontWeight: '800',
    },
    recBody: { flex: 1 },
    recMain: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    recSub: {
        fontSize: 13,
    },
    noResults: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 22,
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 11,
        marginTop: 8,
        marginBottom: 20,
        lineHeight: 16,
    },
});
