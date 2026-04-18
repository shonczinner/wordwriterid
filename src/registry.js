/**
 * WordWriterIDRegistry
 * * Central data store and sequence manager.
 * * Only numbers/tracks blocks that have an [..ID].
 */
export class WordWriterIDRegistry {
    constructor() {
        this.ids = new Map();
        this.bibliography = [];
        this.footnotes = [];
        this.counters = {
            equation: 0, 
            table: 0, 
            figure: 0, 
            algorithm: 0,
            citation: 0, 
            footnote: 0, 
            list: 0
        };
        this.sectionHierarchy = [0, 0, 0];
    }

    reset() {
        this.ids.clear();
        this.bibliography = [];
        this.footnotes = [];
        this.sectionHierarchy = [0, 0, 0];
        Object.keys(this.counters).forEach(k => this.counters[k] = 0);
    }

    /**
     * Handles section hierarchy. Returns existing entry if ID is already known.
     */
    registerSection(id, level, title) {
        if (id && this.ids.has(id)) return this.ids.get(id);

        const index = level.length - 1; 
        let numbers = null;

        if (id) {
            this.sectionHierarchy[index]++;
            for (let i = index + 1; i < this.sectionHierarchy.length; i++) {
                this.sectionHierarchy[i] = 0;
            }
            numbers = this.sectionHierarchy.slice(0, index + 1);
        }
        
        const entry = { id, type: 'section', numbers, title };
        if (id) this.ids.set(id, entry);
        return entry;
    }

    /**
     * Registers general blocks. Returns existing entry if ID is already known.
     */
    register(id, type, metadata = {}) {
        const targetType = this.counters.hasOwnProperty(type) ? type : 'algorithm';
        
        if (id && this.ids.has(id)) {
            const existing = this.ids.get(id);
            if (metadata.content && !existing.metadata.content) {
                existing.metadata.content = metadata.refContent || metadata.content;
            }
            return existing;
        }

        let number = null;
        if (id) {
            this.counters[targetType]++;
            number = this.counters[targetType];
        }
        
        const entry = {
            id,
            type: targetType,
            number,
            metadata: { 
                ...metadata, 
                content: metadata.refContent || metadata.content 
            }
        };

        if (id) {
            this.ids.set(id, entry);
            if (targetType === 'citation') this.bibliography.push(entry);
            if (targetType === 'footnote') this.footnotes.push(entry);
        }

        return entry;
    }
}