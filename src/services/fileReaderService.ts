const encoder = new TextEncoder(); // Used to calculate actual byte size

/**
 * Reads a file from a given byte offset and extracts paragraphs until reaching a specified word limit.
 * The function ensures that paragraphs are properly separated and maintains byte offset tracking.
 *
 * @param file - The File object to read from
 * @param byteOffsetStart - The starting byte offset in the file to begin reading
 * @param wordLimit - Maximum number of words to include in the returned text
 * @param startRow - The starting row number in the file
 * @returns Promise resolving to an object containing:
 *          - text: The extracted text containing complete paragraphs
 *          - byteOffset: The new byte offset after reading the included text
 *          - currentRow: The current row number after reading the text
 */
export async function seekToParagraph(
    file: File,
    byteOffsetStart: number,
    wordLimit: number,
    startRow: number = 1
): Promise<{ text: string; byteOffset: number; currentRow: number }> {
    const stream = file.slice(byteOffsetStart).stream().pipeThrough(new TextDecoderStream());

    const reader = stream.getReader();
    let buffer = '';
    let totalBytesRead = byteOffsetStart; // The actual bytes read from the file
    let includedBytes = 0; // Tracks bytes included in the result
    let currentRow = startRow; // Track current row number

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += value;
        totalBytesRead += encoder.encode(value).length; // Track total bytes read from the stream

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
            // Delimiter case: Count its exact byte size and add it to the included bytes
            includedBytes += encoder.encode(part).length;

            // Only add delimiter if there's already content in `result`
            if (result.length > 0) {
                result += part.trim(); // Preserve only relevant parts
            }

            continue;
        }

        // Paragraph case: Count words and add byte size if it falls within the limit
        const paraWordCount = countWords(part);
        const paraBytes = encoder.encode(part).length; // Byte size of this paragraph text

        if (wordCount + paraWordCount > wordLimit && wordCount > 0) break;

        // Note: Spaces or formatting between paragraphs may be altered here
        result += (result.length > 0 ? '\n\n' : '') + part.trim(); // Add paragraph to the result
        wordCount += paraWordCount;
        includedBytes += paraBytes; // Add the bytes of the paragraph

        if (wordCount >= wordLimit) break;
    }

    // Count newlines in the included text
    const newLines = (result.match(/\n/g) || []).length;
    currentRow += newLines;

    return {
        text: result,
        byteOffset: byteOffsetStart + includedBytes, // Offset = starting byte offset + included bytes
        currentRow
    };
}

// Helper function to count words in a string
function countWords(text: string): number {
    return text.trim().split(/\s+/).length;
}