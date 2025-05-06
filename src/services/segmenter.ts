/**
 * Extracts the next text segment from the input text, respecting paragraph and sentence boundaries.
 *
 * @param text - The input text to be segmented
 * @param wordLimit - Maximum number of words to include in the segment (default: 100)
 * @returns Object containing the ending index of the segment, or null if the input is empty
 *          - index: The character offset where the segment ends
 *          - Returns null for empty or whitespace-only input
 */
export function nextSegment(
    text: string,
    wordLimit: number = 100
): { index: number; } | null {
    if (!text.trim()) {
        return null; // Empty text handling
    }

    // Find the next paragraph boundary
    const paragraphEnd = text.search(/\n\s*\n/); // Search for paragraph delimiters
    const delimiterLength = paragraphEnd !== -1 ? text.match(/\n\s*\n/)![0].length : 0; // Dynamically calculate the delimiter length
    const paragraphText = paragraphEnd !== -1 ? text.slice(0, paragraphEnd) : text;

    const words = paragraphText.split(/\s+/);
    const wordCount = words.length;

    if (wordCount <= wordLimit) {
        // Entire paragraph fits
        const segmentEnd = paragraphEnd !== -1 ? paragraphEnd + delimiterLength : text.length; // Include accurate delimiter
        return { index: segmentEnd };
    }

    // Split into sentences and build the segment
    const sentenceOffsets = getSentenceBoundaries(paragraphText);
    let currentWordCount = 0;
    let segmentEndOffset = 0;

    for (const { start, end } of sentenceOffsets) {
        const sentenceText = text.slice(start, end);
        const wordsInSentence = sentenceText.split(/\s+/).length;

        if (currentWordCount > 0 && currentWordCount + wordsInSentence > wordLimit) {
            // If adding this sentence would exceed the word limit, stop
            break;
        }

        currentWordCount += wordsInSentence;
        segmentEndOffset = end;
    }

    return { index: segmentEndOffset };
}

/**
 * Helper function that identifies sentence boundaries in a paragraph.
 * Uses regex pattern matching to detect sentence endings (., !, ?) and captures
 * the positions of sentence boundaries including trailing spaces.
 *
 * @param paragraph - The paragraph text to split into sentences
 * @returns Array of objects containing start and end offsets for each sentence
 *          - start: The character offset where the sentence begins
 *          - end: The character offset where the sentence ends (including trailing spaces)
 */
function getSentenceBoundaries(paragraph: string): { start: number; end: number }[] {
    const sentenceRegex = /[^.!?]*[.!?]+(?:\s|$)/g; // Match sentences, including their following spaces
    const boundaries: { start: number; end: number }[] = [];
    let match;

    while ((match = sentenceRegex.exec(paragraph)) !== null) {
        boundaries.push({ start: match.index, end: sentenceRegex.lastIndex });
    }

    return boundaries;
}
