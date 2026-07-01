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
 *
 * Layout: top row (label + refresh) / big number center / crash time bottom.
 * The refresh button lives in the top-right corner so the crash time gets
 * the full bottom width and never wraps or collides.
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
                borderRadius: 24,
                paddingHorizontal: 14,
                paddingVertical: 12,
            }}
            clickAction="OPEN_APP"
            accessibilityLabel="Caffeine tracker widget"
        >
            {/* Top row: CAFFEINE label (left) + refresh button (right) */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text="CAFFEINE"
                    style={{
                        fontSize: 9,
                        color: '#59595980',
                        fontFamily: 'monospace',
                        letterSpacing: 1.5,
                    }}
                />
                <FlexWidget
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: '#FFFFFF14',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    clickAction="REFRESH_WIDGET"
                    clickActionData={{ action: 'REFRESH_WIDGET' }}
                >
                    <TextWidget
                        text="↻"
                        style={{
                            fontSize: 16,
                            color: '#FFFFFF99',
                        }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Center: big number + unit */}
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

            {/* Bottom: crash time — full width, centered, never collides */}
            <TextWidget
                text={crashTime}
                truncate="END"
                maxLines={1}
                style={{
                    fontSize: 10,
                    color: '#FFFFFF66',
                    fontFamily: 'monospace',
                    letterSpacing: 0.8,
                    textAlign: 'center',
                }}
            />
        </FlexWidget>
    );
}
