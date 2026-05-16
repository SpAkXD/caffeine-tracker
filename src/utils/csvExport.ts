import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { Dose } from './math';

export async function exportDosesAsCsv(doses: Dose[], effectiveHalfLifeHours: number): Promise<void> {
    const header = 'timestamp_ms,iso_datetime,mg,half_life_hours\n';
    const rows = doses
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((d) => {
            const iso = format(new Date(d.timestamp), "yyyy-MM-dd'T'HH:mm:ss");
            return `${d.timestamp},${iso},${d.mg},${effectiveHalfLifeHours.toFixed(2)}`;
        })
        .join('\n');

    const csv = header + rows;
    const filename = `caffeine-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    const file = new File(Paths.cache, filename);
    file.write(csv);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Caffeine Data',
        UTI: 'public.comma-separated-values-text',
    });
}
