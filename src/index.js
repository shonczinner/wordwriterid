import { WordWriterIDRegistry } from './registry.js';
import { WordWriterIDParser } from './parser.js';
import { EngineSyntax } from './syntax.js';
import katex from 'katex';
import Papa from 'papaparse';
import Prism from 'prismjs';

export class WordWriterID {
    constructor() {
        this.registry = new WordWriterIDRegistry();
        this.parser = new WordWriterIDParser(this.registry);
    }

    /**
     * The Master Lifecycle
     */
    render(text) {
        // 1. Scan everything to build the registry (numbers, IDs, content)
        this.parser.discover(text);

        // 2. Render all blocks into the document flow
        let html = this.renderVisualBlocks(text);

        // 3. Resolve secondary cross-references (the bare [..id] tags)
        html = this.parser.transform(html);

        // 4. Final Markdown touchups (bolding and paragraphs)
        html = this.simpleMarkdown(html);

        return `<div class="wordwriter-container">${html}${this.generateEndMatter()}</div>`;
    }

    renderVisualBlocks(text) {
        let out = text;
        const m = EngineSyntax.map;

        // 1. Sections
        out = out.replace(m.section.regex, (match, ...args) => {
            const g = args.pop();
            const entry = g.id ? this.registry.ids.get(g.id) : this.registry.registerSection(null, g.level, g.title);
            return m.section.render(g, entry);
        });

        // 2. Equations
        out = out.replace(m.equation.regex, (match, ...args) => {
            const g = args.pop();
            const entry = g.id ? this.registry.ids.get(g.id) : this.registry.register(null, 'equation', g);
            const math = katex.renderToString(g.content.trim(), { displayMode: true, throwOnError: false });
            return m.equation.render(g, entry, math);
        });

        // 3. Tables
        out = out.replace(m.table.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.ids.get(g.id);
            const csv = Papa.parse(g.content.trim()).data;
            return m.table.render(g, entry, this.generateTableHtml(csv));
        });

        // 4. Algorithms
        out = out.replace(m.algorithm.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.ids.get(g.id);
            const code = Prism.highlight(g.content.trim(), Prism.languages[g.lang] || Prism.languages.javascript, g.lang);
            return m.algorithm.render(g, entry, code);
        });

        // 5. Figures
        out = out.replace(m.figure.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.ids.get(g.id);
            return m.figure.render(g, entry);
        });

        // 6. Citations (Rendered where declared)
        out = out.replace(m.citation.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.ids.get(g.id);
            return m.citation.render(g, entry);
        });

        // 7. Footnotes (Rendered where declared)
        out = out.replace(m.footnote.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.ids.get(g.id);
            return m.footnote.render(g, entry);
        });

        return out;
    }

    simpleMarkdown(text) {
        // Handle bolding first
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return html.split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                
                // Do not wrap lines that already start with HTML block tags or internal Prism spans
                if (/^<(h\d|div|section|table|tbody|tr|th|td|pre|ol|ul|li|img|span|p|a)/i.test(trimmed)) {
                    return line;
                }
                
                // Preserve spaces as non-breaking spaces
                return `<p>${line.replace(/  /g, ' &nbsp;')}</p>`;
            })
            .filter(l => l !== '')
            .join('\n');
    }

    generateTableHtml(data) {
        const rows = data.map((row, i) => 
            `<tr>${row.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`
        ).join('');
        return `<table class="ww-table"><tbody>${rows}</tbody></table>`;
    }

    generateEndMatter() {
        let html = '';
        const m = EngineSyntax.map;
        
        // Final Footnotes Section (Summary)
        if (this.registry.footnotes.length) {
            const items = this.registry.footnotes.map(n => 
                `<li id="footnote-${n.id}">${n.metadata.content.trim()} <a href="#fnref-${n.id}" class="ww-backref">↩</a></li>`
            ).join('');
            html += `<section class="ww-end-matter"><h3>Footnotes</h3><ol>${items}</ol></section>`;
        }
        
        // Final Bibliography Section (Summary)
        if (this.registry.bibliography.length) {
            const items = this.registry.bibliography.map(b => 
                `<li id="citation-${b.id}"><span class="ww-bib-num">[${b.number}]</span> ${b.metadata.content.trim()}</li>`
            ).join('');
            html += `<section class="ww-end-matter"><h3>Bibliography</h3><ul class="ww-bib-list">${items}</ul></section>`;
        }
        
        return html;
    }
}