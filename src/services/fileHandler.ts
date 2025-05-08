import type {TranslationDocument} from "../types/translationState.ts";

export function saveProgressToFile(translationDoc: TranslationDocument): void {
    const blob = new Blob([JSON.stringify(translationDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = translationDoc.sourceName.replace(/\.txt$/, "") + "-progress.json"
    a.click();
    URL.revokeObjectURL(url);
}

export async function loadTranslationDocument(file: File): Promise<TranslationDocument> {
    const content = await file.text();
    return JSON.parse(content);
}
