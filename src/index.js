/**
 * WordWriterID: Main Orchestrator & Multi-Library Renderer
 * * Serves as the primary API, integrating `katex`, `papaparse`, and `prismjs` 
 * into the document lifecycle. It coordinates the three-step render process: 
 * 1. `parser.discover()` to map IDs, 2. `renderVisualBlocks()` to convert 
 * custom syntax into rich HTML (handling LaTeX, CSV tables, and code highlighting), 
 * and 3. `parser.transform()` to resolve cross-references. It also handles 
 * `simpleMarkdown` for basic text formatting and `generateEndMatter()` 
 * to append the Footnotes and Bibliography sections to the final output.
 */

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

    render(text) {
        this.parser.discover(text);
        let html = this.renderVisualBlocks(text);
        html = this.parser.transform(html);
        html = this.simpleMarkdown(html);
        return `<div class="wordwriter-container">${html}${this.generateEndMatter()}</div>`;
    }

    renderVisualBlocks(text) {
        let out = text;
        const m = EngineSyntax.map;

        // 1. Sections
        out = out.replace(m.section.regex, (match, ...args) => {
            const g = args.pop();
            return m.section.render(g, this.registry.ids.get(g.id));
        });

        // 2. Complex Blocks (Math, Table, Algorithm)
        out = out.replace(m.equation.regex, (match, ...args) => {
            const g = args.pop();
            const math = katex.renderToString(g.content.trim(), { displayMode: true, throwOnError: false });
            return m.equation.render(g, this.registry.ids.get(g.id), math);
        });

        out = out.replace(m.table.regex, (match, ...args) => {
            const g = args.pop();
            const csv = Papa.parse(g.content.trim()).data;
            return m.table.render(g, this.registry.ids.get(g.id), this.generateTableHtml(csv));
        });

        out = out.replace(m.algorithm.regex, (match, ...args) => {
            const g = args.pop();
            const code = Prism.highlight(g.content.trim(), Prism.languages[g.lang] || Prism.languages.javascript, g.lang);
            return m.algorithm.render(g, this.registry.ids.get(g.id), code);
        });

        // 3. Figures
        out = out.replace(m.figure.regex, (match, ...args) => {
            const g = args.pop();
            return m.figure.render(g, this.registry.ids.get(g.id));
        });

        // 4. Referencable Lists (Container then Items)
        // We first identify the list container, then render the items inside its scope
        out = out.replace(m.list.regex, (match, ...args) => {
            const g = args.pop();
            const listEntry = this.registry.registerList(g.id, g.type, g.title);
            
            // Find the list content (everything until the next block or double newline)
            // For now, we assume the list content is manually scoped or handled by the parser discovery
            // We find all items belonging to this list
            let itemsHtml = "";
            const itemRegex = new RegExp(m.listItem.regex.source, 'gs');
            let itemMatch;
            
            // Note: In a full implementation, we'd slice the text to only look 
            // inside this list's range. For now, we render based on registry info.
            while ((itemMatch = itemRegex.exec(text)) !== null) {
                const ig = itemMatch.groups;
                const iEntry = this.registry.registerListItem(ig.id, ig.content);
                itemsHtml += m.listItem.render(ig, iEntry);
            }

            return m.list.render(g, listEntry, itemsHtml);
        });

        return out;
    }

    simpleMarkdown(text) {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html.split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                if (/^<(h\d|div|section|table|pre|ul|ol|li|img|blockquote)/i.test(trimmed)) return line;
                const preservedLine = line.replace(/  /g, ' &nbsp;');
                return `<p>${preservedLine}</p>`;
            })
            .filter(l => l !== '')
            .join('\n');
    }

    generateTableHtml(data) {
        const rows = data.map((row, i) => `<tr>${row.map(c => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('');
        return `<table class="ww-table"><tbody>${rows}</tbody></table>`;
    }

    generateEndMatter() {
        let html = '';
        const m = EngineSyntax.map;
        const notes = this.registry.footnotes;
        const bibs = this.registry.bibliography;

        if (notes.length) {
            html += `<section class="ww-end-matter"><h3>Footnotes</h3><ol>${notes.map(n => 
                m.footnote.render(n.id, n.number, n.metadata.content)).join('')}</ol></section>`;
        }
        if (bibs.length) {
            html += `<section class="ww-end-matter"><h3>Bibliography</h3><ul class="ww-bib-list">${bibs.map(b => 
                m.citation.render(b.id, b.number, b.metadata.content)).join('')}</ul></section>`;
        }
        return html;
    }
}