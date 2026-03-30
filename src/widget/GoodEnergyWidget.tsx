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
                padding: 14,
            }}
            clickAction="OPEN_APP"
            accessibilityLabel="Caffeine tracker widget"
        >
            {/* Top: CAFFEINE label */}
            <TextWidget
                text="CAFFEINE"
                style={{
                    fontSize: 10,
                    color: '#59595980',
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                }}
            />

            {/* Center: Big number + unit — flex: 1 fills vertical space between label and bottom row */}
            <FlexWidget
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                }}
            >
                <TextWidget
                    text={`${currentLevel}`}
                    style={{
                        fontSize: 48,
                        color: '#FFFFFF',
                        fontFamily: 'monospace',
                    }}
                />
                <TextWidget
                    text="mg"
                    style={{
                        fontSize: 14,
                        color: '#FFFFFF4D',
                        fontFamily: 'monospace',
                        letterSpacing: 3,
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
                }}
            >
                <TextWidget
                    text={crashTime}
                    style={{
                        fontSize: 10,
                        color: '#FFFFFF66',
                        fontFamily: 'monospace',
                        letterSpacing: 1,
                    }}
                />
                {/* Manual refresh button — larger tap target for easier interaction */}
                <FlexWidget
                    style={{
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderRadius: 10,
                        backgroundColor: '#FFFFFF1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    clickAction="REFRESH_WIDGET"
                    clickActionData={{ action: 'REFRESH_WIDGET' }}
                >
                    <TextWidget
                        text="⟳"
                        style={{
                            fontSize: 18,
                            color: '#FFFFFFAA',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>
        </FlexWidget>
    );
}
