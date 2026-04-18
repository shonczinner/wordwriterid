import { EngineSyntax } from './syntax.js';

/**
 * WordWriterIDParser
 * * Handles the identification of document structures and the 
 * * final conversion of ID-based cross-references into HTML links.
 */
export class WordWriterIDParser {
    constructor(registry) {
        this.registry = registry;
    }

    /**
     * Phase 1: Discovery
     * Scans the document to build a Map of all IDs, their types, 
     * assigned numbers, and associated metadata.
     */
    discover(text) {
        this.registry.reset();
        
        // 1. Sections (Scan line by line to maintain hierarchy)
        text.split('\n').forEach(line => {
            const m = EngineSyntax.map.section.regex.exec(line);
            if (m) {
                this.registry.registerSection(m.groups.id, m.groups.level, m.groups.title);
            }
            // Reset regex state for next line scan
            EngineSyntax.map.section.regex.lastIndex = 0;
        });

        // 2. All other blocks (Equations, Tables, Figures, Citations, Footnotes)
        Object.entries(EngineSyntax.map).forEach(([type, config]) => {
            if (type === 'section') return;
            config.regex.lastIndex = 0;
            let match;
            while ((match = config.regex.exec(text)) !== null) {
                this.registry.register(match.groups.id, type, { ...match.groups });
            }
        });
    }

    /**
     * Phase 2: Transform
     * Resolves stand-alone [..id] tags into functional HTML links.
     */
    transform(text) {
        return text.replace(EngineSyntax.utils.reference, (match, id) => {
            const entry = this.registry.ids.get(id);
            
            // If the ID isn't in the registry, return the raw match
            if (!entry) return match; 
            
            const config = EngineSyntax.map[entry.type];
            if (!config || !config.ref) return match;

            const num = entry.numbers || entry.number;
            const label = config.ref(num);
            
            // Generate link to the original block/declaration
            // Note: section IDs are prefixed with 'section-', equations with 'equation-', etc.
            return `<a href="#${entry.type}-${id}" class="ww-ref-link">${label}</a>`;
        });
    }
}