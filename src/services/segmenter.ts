const encoder = new TextEncoder(); // Create TextEncoder once at the top

/**
 * Splits input text into segments based on paragraph boundaries and word limits.
 *
 * @param text - The input text to be segmented
 * @param maxWordsPerSegment - Maximum number of words allowed per segment (default: 100)
 * @returns Object containing end offset and byte offset of the segment, or null if text is empty
 */
export function nextSegment(
    text: string,
    maxWordsPerSegment: number = 100
): { endOffset: number; byteOffset: number } | null {
    if (!text.trim()) {
        return null; // Empty text handling
    }

    // Find the next paragraph boundary
    const paragraphEnd = text.search(/\n\s*\n/);
    const paragraphText = paragraphEnd !== -1 ? text.slice(0, paragraphEnd) : text;

    const words = paragraphText.split(/\s+/);
    const wordCount = words.length;

    if (wordCount <= maxWordsPerSegment) {
        // Entire paragraph fits
        const endOffset = paragraphEnd !== -1 ? paragraphEnd + 2 : text.length; // Include "\n\n"
        const byteOffset = encoder.encode(text.slice(0, endOffset)).length;
        return { endOffset, byteOffset };
    }

    // Split into sentences and build the segment
    const sentenceOffsets = getSentencesDelims(paragraphText);
    let currentWordCount = 0;
    let segmentEndOffset = 0;

    for (const { start, end } of sentenceOffsets) {
        const sentenceText = text.slice(start, end);
        const wordsInSentence = sentenceText.split(/\s+/).length;

        if (currentWordCount + wordsInSentence > maxWordsPerSegment) {
            // If adding this sentence would exceed the word limit, stop
            break;
        }

        currentWordCount += wordsInSentence;
        segmentEndOffset = end;
    }

    const byteOffset = encoder.encode(text.slice(0, segmentEndOffset)).length;
    return { endOffset: segmentEndOffset, byteOffset };
}

/**
 * Helper function that splits a paragraph into sentence offsets.
 *
 * @param paragraph - The paragraph text to split into sentences
 * @returns Array of objects containing start and end offsets for each sentence
 */
function getSentencesDelims(paragraph: string): { start: number; end: number }[] {
    const sentenceRegex = /[^.!?]*[.!?]+(?:\s|$)/g; // Match sentences with punctuation
    const offsets: { start: number; end: number }[] = [];
    let match;

    while ((match = sentenceRegex.exec(paragraph)) !== null) {
        offsets.push({ start: match.index, end: sentenceRegex.lastIndex });
    }

    return offsets;
}
