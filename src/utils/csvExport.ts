import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Dose } from './math';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function exportDosesAsCsv(doses: Dose[], effectiveHalfLifeHours: number): Promise<void> {
    // Build rows as plain objects so the header row comes from the keys.
    const rows = doses
        .slice()
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((d) => ({
            timestamp_ms: d.timestamp,
            datetime: format(new Date(d.timestamp), "yyyy-MM-dd'T'HH:mm:ss"),
            mg: d.mg,
            half_life_hours: Number(effectiveHalfLifeHours.toFixed(2)),
        }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Caffeine');

    // Write workbook to a base64 string, then to a cache file as binary.
    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const filename = `caffeine-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    const uri = (FileSystem.cacheDirectory ?? '') + filename;

    await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(uri, {
        mimeType: XLSX_MIME,
        dialogTitle: 'Export Caffeine Data',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
}
