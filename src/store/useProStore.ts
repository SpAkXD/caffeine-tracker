import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCaffeineStore } from './useCaffeineStore';

interface ProState {
    hasPurchased: boolean;
    purchaseToken: string | null;
    purchaseDate: number | null;
    lastVerifiedAt: number;

    setPurchase: (token: string, date: number) => void;
    clearPurchase: () => void;
    isPro: () => boolean;
}

export const useProStore = create<ProState>()(
    persist(
        (set, get) => ({
            hasPurchased: false,
            purchaseToken: null,
            purchaseDate: null,
            lastVerifiedAt: 0,

            setPurchase: (token, date) => {
                set({ hasPurchased: true, purchaseToken: token, purchaseDate: date, lastVerifiedAt: Date.now() });
            },

            clearPurchase: () => {
                set({ hasPurchased: false, purchaseToken: null, purchaseDate: null, lastVerifiedAt: Date.now() });
            },

            isPro: () => {
                const isProDebug = useCaffeineStore.getState().isProDebug;
                return isProDebug || get().hasPurchased;
            },
        }),
        {
            name: 'pro-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
