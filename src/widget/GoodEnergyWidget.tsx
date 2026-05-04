'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface GoodEnergyWidgetProps {
    currentLevel: number;
    crashTime: string; // e.g. "Crash at 2:30 PM" or "· · · Clear · · ·"
}

/**
 * Real Android Home Screen Widget — "Nothing Phone" aesthetic.
 *
 * Pure black, monospace, high contrast. No hooks allowed.
 * Uses FlexWidget/TextWidget primitives only.
 */
export function GoodEnergyWidget({ currentLevel, crashTime }: GoodEnergyWidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#000000',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
            }}
            clickAction="OPEN_APP"
            accessibilityLabel="Caffeine tracker widget"
        >
            {/* Top: CAFFEINE label */}
            <TextWidget
                text="CAFFEINE"
                style={{
                    fontSize: 9,
                    color: '#59595980',
                    fontFamily: 'monospace',
                    letterSpacing: 1.5,
                }}
            />

            {/* Center: Big number + unit — flex: 1 fills vertical space between label and bottom row */}
            <FlexWidget
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text={`${currentLevel}`}
                    style={{
                        fontSize: 44,
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                    }}
                />
                <TextWidget
                    text="mg"
                    style={{
                        fontSize: 12,
                        color: '#FFFFFF4D',
                        fontFamily: 'monospace',
                        letterSpacing: 2.5,
                    }}
                />
            </FlexWidget>

            {/* Bottom row: Crash time + Refresh button */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                <TextWidget
                    text={crashTime}
                    style={{
                        fontSize: 10,
                        color: '#FFFFFF66',
                        fontFamily: 'monospace',
                        letterSpacing: 0.8,
                        flex: 1,
                    }}
                />
                {/* Manual refresh button — larger tap target for easier interaction */}
                <FlexWidget
                    style={{
                        minWidth: 50,
                        minHeight: 44,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    clickAction="REFRESH_WIDGET"
                    clickActionData={{ action: 'REFRESH_WIDGET' }}
                >
                    <TextWidget
                        text="↻"
                        style={{
                            fontSize: 20,
                            color: '#FFFFFFAA',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>
        </FlexWidget>
    );
}
