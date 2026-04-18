/**
 * WordWriterIDRegistry
 * * Acts as the central data store for the document.
 * * Manages sequential numbering for all block types.
 * * Stores metadata (citations/footnotes) for end-matter generation.
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

    /**
     * Clears all state for a fresh render pass.
     */
    reset() {
        this.ids.clear();
        this.bibliography = [];
        this.footnotes = [];
        this.sectionHierarchy = [0, 0, 0];
        Object.keys(this.counters).forEach(k => this.counters[k] = 0);
    }

    /**
     * Handles hierarchical section numbering (e.g., 1.2.1).
     */
    registerSection(id, level, title) {
        // level comes from regex as '#', '##', or '###'
        const index = level.length - 1; 
        
        // Increment current level
        this.sectionHierarchy[index]++;
        
        // Reset all sub-levels (e.g., moving from 1.2 to 2.0.0)
        for (let i = index + 1; i < this.sectionHierarchy.length; i++) {
            this.sectionHierarchy[i] = 0;
        }
        
        const entry = {
            id, 
            type: 'section',
            numbers: this.sectionHierarchy.slice(0, index + 1),
            title: title
        };
        
        // Only map if an ID was provided; otherwise, it's just a numbered heading
        if (id) this.ids.set(id, entry);
        return entry;
    }

    /**
     * Registers a block (Equation, Table, Citation, etc.) and assigns a sequence number.
     */
    register(id, type, metadata = {}) {
        const targetType = this.counters.hasOwnProperty(type) ? type : 'algorithm';
        
        // Always increment the counter for the type
        this.counters[targetType]++;
        
        const entry = {
            id,
            type: targetType,
            number: this.counters[targetType],
            metadata: { 
                ...metadata, 
                // Prioritize 'refContent' (from parentheses) over block 'content'
                content: metadata.refContent || metadata.content 
            }
        };

        // If ID exists, handle potential duplicate declarations or updates
        if (id) {
            if (this.ids.has(id)) {
                const existing = this.ids.get(id);
                // If the new pass found content but the old one didn't, update it
                if (entry.metadata.content && !existing.metadata.content) {
                    existing.metadata.content = entry.metadata.content;
                }
                return existing;
            }
            this.ids.set(id, entry);
        }

        // Push citations and footnotes to their respective lists for the Bibliography/Footnotes section
        if (targetType === 'citation') this.bibliography.push(entry);
        if (targetType === 'footnote') this.footnotes.push(entry);

        return entry;
    }
}