import type {SegmentRange} from "../types/translationState.ts";

/**
 * Reads a file from a given byte offset and extracts complete paragraphs until reaching a specified word limit.
 * The function ensures paragraphs are properly separated by blank lines and stops at paragraph boundaries.
 *
 * @param file - The File object to read from
 * @param byteOffsetStart - The starting byte offset in the file to begin reading
 * @param wordLimit - Maximum number of words to include in the returned text
 * @returns Promise resolving to an object containing:
 *          - text: The extracted text containing complete paragraphs up to the word limit
 */
export async function seekToParagraph(
    file: File,
    byteOffsetStart: number,
    wordLimit: number,
): Promise<{ text: string; }> {
    const stream = file.slice(byteOffsetStart).stream().pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;

        // Stop reading if there's at least one paragraph and the word limit is likely reached
        if (/\n\s*\n/.test(buffer) && countWords(buffer) >= wordLimit) break;
    }

    // Split buffer into paragraphs while preserving delimiters
    const delimiterRegex = /(\n\s*\n)/; // Matches the exact delimiters
    const parts = buffer.split(delimiterRegex); // Splits into both text and delimiters

    let result = '';
    let wordCount = 0;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (delimiterRegex.test(part)) {
            result += part;
            continue;
        }

        // For paragraph text, count words and check if the limit is exceeded
        const paraWordCount = countWords(part);
        if (wordCount + paraWordCount > wordLimit && wordCount > 0) break;

        result += part;
        wordCount += paraWordCount;

        if (wordCount >= wordLimit) break; // Stop if the word limit is reached
    }

    return {
        text: result,
    };
}

export async function getText(file: File, range: SegmentRange): Promise<{ text: string }> {
    const stream = file.slice(range.start.byteOffset, range.end.byteOffset).stream().pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    let buffer = '';

    // Read the file slice within the range
    while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Exit when the reading is finished
        buffer += value;
    }

    return { text: buffer };
}

// Helper function to count words in a string
function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}
