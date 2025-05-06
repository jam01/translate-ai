// Segment Coordinates: Row & Column (e.g., from line/column parser)
export interface TextPosition {
    row: number;
    column: number;
    byteOffset: number; // byte offset from start of file
}

export interface SegmentRange {
    start: TextPosition;
    end: TextPosition;
}

// Translation Decision Entry
export interface TranslationDecision {
    comment?: string;
    terms: Record<string, string>; // e.g. { "API": "接口", "backend": "后端" }
}

// A single translation unit
export interface Segment {
    id: number;
    range: SegmentRange;
    translation?: string;
    comments: string[];
    annotations: string[];
    decisions: TranslationDecision[];
    updatedAt?: number;
}

// Full document state
export interface TranslationDocument {
    sourceName: string;
    segments: Segment[];
    sourceTextHash?: string; // optional hash to detect changes
    lastProcessedPosition: TextPosition; // last processed text position
    lastUpdatedAt: number;
}
