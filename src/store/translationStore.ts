import { defineStore } from 'pinia'
import type {Segment, SegmentRange, TranslationDecision, TranslationDocument} from "../types/translationState.ts";


export const useTranslationStore = defineStore('translation', {
    state: (): TranslationDocument => ({
        filePath: '',
        segments: [],
        lastUpdatedAt: Date.now(),
        lastProcessedByteOffset: 0,
    }),

    getters: {
        hasSegments: (state): boolean => state.segments.length > 0,
        progress: (state): number => {
            const total = state.segments.length
            const processed = state.segments.filter((s) => s.status === 'processed').length
            return total ? Math.round((processed / total) * 100) : 0
        },
    },

    actions: {
        addSegment(range: SegmentRange): void {
            const newSegment: Segment = {
                id: this.segments.length + 1,
                range,
                status: 'unprocessed',
                comments: [],
                annotations: [],
                decisions: [],
                updatedAt: undefined,
            }
            this.segments.push(newSegment)
            this.lastProcessedByteOffset = range.end.byteOffset
            this.saveToLocalStorage()
        },

        markSegmentAsTranslated(id: number, translation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return
            seg.translation = translation
            seg.status = 'processed'
            seg.updatedAt = Date.now()
            this.lastProcessedByteOffset = seg.range.end.byteOffset
            this.saveToLocalStorage()
        },

        updateSegmentTranslation(id: number, translation: string): void {
            const seg = this.getSegmentById(id)
            if (!seg) return

            seg.translation = translation
            seg.status = 'processed'
            seg.updatedAt = Date.now()
            this.lastUpdatedAt = Date.now()

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
            return this.segments.find((seg) => seg.id === id)
        },

        setFilePath(path: string): void {
            this.filePath = path
            this.saveToLocalStorage()
        },

        loadDocument(data: TranslationDocument): void {
            this.$state = data
            this.saveToLocalStorage()
        },

        saveToLocalStorage(): void {
            localStorage.setItem('translation_session', JSON.stringify(this.$state))
        },

        loadFromLocalStorage(): boolean {
            const raw = localStorage.getItem('translation_session')
            if (raw) {
                try {
                    const parsed = JSON.parse(raw)
                    this.$patch(parsed)
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
