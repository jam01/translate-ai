import { defineStore } from 'pinia'
import type {Segment, SegmentRange, TranslationDecision, TranslationDocument} from "../types/translationState.ts";


export const useTranslationStore = defineStore('translation', {
    state: () => ({
        sourceFile: null as File | null,
        translationDoc: {
            segments: [],
            lastUpdatedAt: Date.now(),
            lastProcessedByteOffset: 0,
        } as TranslationDocument,
    }),

    getters: {
        hasSegments: (state): boolean => state.translationDoc.segments.length > 0,
        progress: (state): number => {
            const total = state.translationDoc.segments.length
            const processed = state.translationDoc.segments.filter((s) => s.status === 'processed').length
            return total ? Math.round((processed / total) * 100) : 0
        },
    },

    actions: {
        addSegment(range: SegmentRange): void {
            const newSegment: Segment = {
                id: this.translationDoc.segments.length + 1,
                range,
                status: 'unprocessed',
                comments: [],
                annotations: [],
                decisions: [],
                updatedAt: undefined,
            }
            this.translationDoc.segments.push(newSegment)
            this.translationDoc.lastProcessedByteOffset = range.end.byteOffset
            this.saveToLocalStorage()
        },

        markSegmentAsTranslated(id: number, translation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return
            seg.translation = translation
            seg.status = 'processed'
            seg.updatedAt = Date.now()
            this.translationDoc.lastProcessedByteOffset = seg.range.end.byteOffset
            this.saveToLocalStorage()
        },

        updateSegmentTranslation(id: number, translation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.translation = translation
            seg.status = 'processed'
            seg.updatedAt = Date.now()
            this.translationDoc.lastUpdatedAt = Date.now()

            this.saveToLocalStorage()
        },

        addCommentToSegment(id: number, comment: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.comments.push(comment)
            this.saveToLocalStorage()
        },

        addAnnotationToSegment(id: number, annotation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.annotations.push(annotation)
            this.saveToLocalStorage()
        },

        addTranslationDecision(id: number, decision: TranslationDecision): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.decisions.push(decision)
            this.saveToLocalStorage()
        },

        getSegmentById(id: number): Segment | undefined {
            return this.translationDoc.segments.find((seg) => seg.id === id)
        },

        setSourceFile(file: File): void {
            this.sourceFile = file
        },

        loadDocument(data: TranslationDocument): void {
            this.$state.translationDoc = data
            this.saveToLocalStorage()
        },

        saveToLocalStorage(): void {
            localStorage.setItem('translation_session', JSON.stringify(this.$state.translationDoc))
        },

        loadFromLocalStorage(): boolean {
            const raw = localStorage.getItem('translation_session')
            if (raw) {
                try {
                    const parsed = JSON.parse(raw)
                    this.$patch({translationDoc: parsed})
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
    },
})
