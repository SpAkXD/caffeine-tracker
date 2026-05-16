import {
    initConnection,
    endConnection,
    getAvailablePurchases,
    requestPurchase,
    Purchase,
    PurchaseError,
    ErrorCode,
    finishTransaction,
} from 'react-native-iap';
import { useProStore } from '../store/useProStore';

export const PRO_SKU = 'pro_unlock_lifetime';

export async function initIAP(): Promise<void> {
    try {
        await initConnection();
        await syncEntitlement();
    } catch {
        // IAP unavailable (no Play Services) — keep persisted state
    }
}

export async function endIAP(): Promise<void> {
    try {
        await endConnection();
    } catch {
        // ignore
    }
}

async function syncEntitlement(): Promise<void> {
    try {
        const purchases = await getAvailablePurchases();
        const hasPro = purchases.some((p) => p.productId === PRO_SKU);
        const { setPurchase, clearPurchase, hasPurchased } = useProStore.getState();

        if (hasPro) {
            const match = purchases.find((p) => p.productId === PRO_SKU)!;
            setPurchase(match.purchaseToken ?? '', match.transactionDate ?? Date.now());
        } else if (hasPurchased) {
            // Play Store no longer reports entitlement (refund / revocation)
            clearPurchase();
        }
    } catch {
        // Network unavailable — keep persisted state
    }
}

export async function purchasePro(): Promise<void> {
    await requestPurchase({
        request: {
            google: { skus: [PRO_SKU] },
        },
        type: 'in-app',
    });
    // finishTransaction is called from the purchase listener set up in _layout.tsx
}

export async function restorePurchases(): Promise<boolean> {
    await syncEntitlement();
    return useProStore.getState().hasPurchased;
}

export function handlePurchaseSuccess(purchase: Purchase): void {
    if (purchase.productId !== PRO_SKU) return;
    const { setPurchase } = useProStore.getState();
    setPurchase(purchase.purchaseToken ?? '', purchase.transactionDate ?? Date.now());
    finishTransaction({ purchase, isConsumable: false }).catch(() => {});
}

export function handlePurchaseError(error: PurchaseError): void {
    if (error.code === ErrorCode.UserCancelled) return;
    console.warn('[IAP] purchase error:', error.message);
}
