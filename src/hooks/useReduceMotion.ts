import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Mirrors system “Reduce motion” — skips stagger/spring-style entrances when true.
 */
export function useReduceMotion(): boolean {
    const [reduce, setReduce] = useState(false);

    useEffect(() => {
        let cancelled = false;
        AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            if (!cancelled) setReduce(enabled);
        });
        const sub = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setReduce
        );
        return () => {
            cancelled = true;
            sub.remove();
        };
    }, []);

    return reduce;
}
