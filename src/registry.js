/**
 * WordWriterID: State & Cross-Reference Manager
 * * Maintains the `ids` Map and `counters` object to track the document's 
 * internal state. It uses `registerSection` for header nesting and 
 * `registerList`/`registerListItem` for list hierarchies. It ensures ID 
 * uniqueness by preventing double-counting on repeat citations and populates 
 * bibliography/footnote arrays for footer rendering.
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
            list: 0 // Shared for ol and ul
        };
        this.sectionHierarchy = [0, 0, 0];
        this.activeList = null; // Tracks current list for item nesting
    }

    reset() {
        this.ids.clear();
        this.bibliography = [];
        this.footnotes = [];
        this.sectionHierarchy = [0, 0, 0];
        this.activeList = null;
        for (let key in this.counters) {
            this.counters[key] = 0;
        }
    }

    registerSection(id, level, title) {
        if (!id) return null;
        const index = level.length - 1; 
        this.sectionHierarchy[index]++;
        for (let i = index + 1; i < this.sectionHierarchy.length; i++) {
            this.sectionHierarchy[i] = 0;
        }
        const entry = {
            id,
            type: 'section',
            numbers: this.sectionHierarchy.slice(0, index + 1),
            title: title
        };
        this.ids.set(id, entry);
        return entry;
    }

    /**
     * registerList
     * Sets the context for subsequent items.
     */
    registerList(id, type, title) {
        this.counters.list++;
        const entry = {
            id,
            type: 'list',
            listType: type, // ordered or unordered
            number: this.counters.list,
            title: title,
            itemCount: 0
        };
        
        if (id) this.ids.set(id, entry);
        this.activeList = entry;
        return entry;
    }

    /**
     * registerListItem
     * Uses activeList to generate numbers like 1.1
     */
    registerListItem(id, content) {
        if (!this.activeList) return null;
        
        this.activeList.itemCount++;
        const entry = {
            id,
            type: 'listItem',
            numbers: [this.activeList.number, this.activeList.itemCount],
            content: content
        };

        if (id) this.ids.set(id, entry);
        return entry;
    }

    register(id, type, metadata = {}) {
        if (id && this.ids.has(id)) {
            const existing = this.ids.get(id);
            if (metadata.content && !existing.metadata.content) {
                existing.metadata.content = metadata.content;
            }
            return existing;
        }

        if (!id) return null;

        const targetType = this.counters.hasOwnProperty(type) ? type : 'algorithm';
        this.counters[targetType]++;
        
        const entry = {
            id,
            type: targetType,
            number: this.counters[targetType],
            metadata: metadata || {}
        };

        if (targetType === 'citation') this.bibliography.push(entry);
        if (targetType === 'footnote') this.footnotes.push(entry);

        this.ids.set(id, entry);
        return entry;
    }
}