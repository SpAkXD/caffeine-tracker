import { useProStore } from '../store/useProStore';

export const PRO_SKU = 'pro_unlock_lifetime';

// Local minimal types — avoid any compile-time `import type` reference to
// `react-native-iap` so Metro / Babel cannot accidentally hoist it into a
// static require. The real shapes come from the runtime lib.
type AnyPurchase = {
    productId: string;
    purchaseToken?: string | null;
    transactionDate?: number | null;
};
type AnyPurchaseError = { code?: string; message?: string };

// Lazy-load react-native-iap so the app starts fine in Expo Go / environments
// without native Nitro modules. IAP calls silently no-op when unavailable.
// Cached after first attempt so we don't pay the require/catch cost repeatedly.
let _cached: any | null = null;
let _tried = false;
function iap(): any | null {
    if (_tried) return _cached;
    _tried = true;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        _cached = require('react-native-iap');
    } catch {
        _cached = null;
    }
    return _cached;
}

export async function initIAP(): Promise<void> {
    const lib = iap();
    if (!lib) return;
    try {
        await lib.initConnection();
        // Pre-fetch product details so the Play Billing client has them cached
        // before the user taps "Buy". Without this, launchBillingFlow can fail
        // silently in Play Billing v7 because ProductDetails aren't resolved yet.
        await lib.fetchProducts({ skus: [PRO_SKU], type: 'in-app' });
        await syncEntitlement();
    } catch {
        // IAP unavailable (no Play Services) — keep persisted state
    }
}

export async function endIAP(): Promise<void> {
    const lib = iap();
    if (!lib) return;
    try {
        await lib.endConnection();
    } catch {
        // ignore
    }
}

async function syncEntitlement(): Promise<void> {
    const lib = iap();
    if (!lib) return;
    try {
        const purchases: AnyPurchase[] = await lib.getAvailablePurchases();
        const hasPro = purchases.some((p) => p.productId === PRO_SKU);
        const { setPurchase, clearPurchase, hasPurchased } = useProStore.getState();
        if (hasPro) {
            const match = purchases.find((p) => p.productId === PRO_SKU)!;
            setPurchase(match.purchaseToken ?? '', match.transactionDate ?? Date.now());
        } else if (hasPurchased) {
            clearPurchase();
        }
    } catch {
        // Network unavailable — keep persisted state
    }
}

export async function purchasePro(): Promise<void> {
    const lib = iap();
    if (!lib) throw new Error('IAP not available on this device.');

    // Fetch product first — validates it's available and ensures the billing
    // client has ProductDetails cached, which Play Billing v7 requires before
    // launchBillingFlow will succeed.
    const products = await lib.fetchProducts({ skus: [PRO_SKU], type: 'in-app' });
    if (!products || products.length === 0) {
        throw new Error(
            `Product "${PRO_SKU}" not found. Make sure it is Active in Play Console and your account is a closed testing tester.`
        );
    }

    await lib.requestPurchase({
        request: { google: { skus: [PRO_SKU] } },
        type: 'in-app',
    });
}

export async function restorePurchases(): Promise<boolean> {
    await syncEntitlement();
    return useProStore.getState().hasPurchased;
}

export function handlePurchaseSuccess(purchase: AnyPurchase): void {
    if (purchase.productId !== PRO_SKU) return;
    const lib = iap();
    const { setPurchase } = useProStore.getState();
    setPurchase(purchase.purchaseToken ?? '', purchase.transactionDate ?? Date.now());
    lib?.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
}

export function handlePurchaseError(error: AnyPurchaseError): void {
    if (error?.code === 'user-cancelled' || error?.code === 'E_USER_CANCELLED') return;
    console.warn('[IAP] purchase error:', JSON.stringify(error));
    // Surface billing errors to the user so they're not silently swallowed
    const { Alert } = require('react-native');
    Alert.alert(
        'Purchase error',
        `Code: ${error?.code ?? 'unknown'}\n${error?.message ?? 'Something went wrong'}`,
    );
}

/** Sets up purchase listeners. Returns a cleanup function. */
export function setupPurchaseListeners(): () => void {
    const lib = iap();
    if (!lib) return () => {};
    try {
        const purchaseSub = lib.purchaseUpdatedListener(handlePurchaseSuccess);
        const errorSub = lib.purchaseErrorListener(handlePurchaseError);
        return () => {
            try { purchaseSub.remove(); } catch {}
            try { errorSub.remove(); } catch {}
        };
    } catch {
        return () => {};
    }
}
