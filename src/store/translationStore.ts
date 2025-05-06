import { defineStore } from 'pinia'
import type {
    Segment,
    SegmentRange,
    TranslationDecision,
    TranslationDocument
} from "../types/translationState.ts";


export const useTranslationStore = defineStore('translation', {
    state: () => ({
        sourceFile: null as File | null,
        workingSegment: null as SegmentRange | null,
        translationDoc: {
            sourceName: 'unnamed.txt',
            segments: [],
            lastUpdatedAt: Date.now(),
            lastProcessedPosition: { row: 0, column: 0, byteOffset: 0 },
        } as TranslationDocument,
    }),

    getters: {
        hasSegments: (state): boolean => state.translationDoc.segments.length > 0,
    },

    actions: {
        addSegment(range: SegmentRange): void {
            const newSegment: Segment = {
                id: this.translationDoc.segments.length + 1,
                range,
                comments: [],
                annotations: [],
                decisions: [],
                updatedAt: undefined,
            }
            this.translationDoc.segments.push(newSegment)
            this.translationDoc.lastUpdatedAt = Date.now()
            this.saveToBrowserStorage()
        },

        updateSegmentTranslation(id: number, translation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) throw new Error("Segment not found!")

            seg.translation = translation
            seg.updatedAt = Date.now()
            this.translationDoc.lastUpdatedAt = Date.now()

            this.saveToBrowserStorage()
        },

        addCommentToSegment(id: number, comment: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.comments.push(comment)
            this.saveToBrowserStorage()
        },

        addAnnotationToSegment(id: number, annotation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.annotations.push(annotation)
            this.saveToBrowserStorage()
        },

        addTranslationDecision(id: number, decision: TranslationDecision): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.decisions.push(decision)
            this.saveToBrowserStorage()
        },

        getSegmentById(id: number): Segment | undefined {
            return this.translationDoc.segments.find((seg) => seg.id === id)
        },

        setSourceFile(file: File): void {
            this.sourceFile = file
            this.translationDoc.sourceName = file.name
        },

        loadDocument(data: TranslationDocument): void {
            this.$state.translationDoc = data
            this.saveToBrowserStorage()
        },

        saveToBrowserStorage(): void {
            localStorage.setItem('translation_session', JSON.stringify(this.$state.translationDoc))
        },

        loadFromBrowserStorage(): boolean {
            const raw = localStorage.getItem('translation_session')
            if (raw) {
                try {
                    const parsed = JSON.parse(raw)
                    this.$patch({ translationDoc: parsed })
                    return true
                } catch (e) {
                    console.error('Failed to load session:', e)
                    return false
                }
            }
            return false
        },

        clearSession(): void {
            localStorage.removeItem('translation_session')
            this.$reset()
        },

        setWorkingSegment(range: SegmentRange): void {
            this.workingSegment = range
        },
    },
})
