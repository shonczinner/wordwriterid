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

        out = out.replace(m.section.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.registerSection(g.id, g.level, g.title);
            return m.section.render(g, entry);
        });

        out = out.replace(m.equation.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'equation', g);
            const math = katex.renderToString(g.content.trim(), { displayMode: true, throwOnError: false });
            return m.equation.render(g, entry, math);
        });

        out = out.replace(m.table.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'table', g);
            const csv = Papa.parse(g.content.trim()).data;
            return m.table.render(g, entry, this.generateTableHtml(csv));
        });

        out = out.replace(m.algorithm.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'algorithm', g);
            const code = Prism.highlight(g.content.trim(), Prism.languages[g.lang] || Prism.languages.javascript, g.lang);
            return m.algorithm.render(g, entry, code);
        });

        out = out.replace(m.figure.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'figure', g);
            return m.figure.render(g, entry);
        });

        out = out.replace(m.citation.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'citation', g);
            return m.citation.render(g, entry);
        });

        out = out.replace(m.footnote.regex, (match, ...args) => {
            const g = args.pop();
            const entry = this.registry.register(g.id, 'footnote', g);
            return m.footnote.render(g, entry);
        });

        return out;
    }

    simpleMarkdown(text) {
        let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html.split('\n')
            .map(line => {
                const trimmed = line.trim();
                if (!trimmed) return '';
                if (/^<(h\d|div|section|table|tbody|tr|th|td|pre|ol|ul|li|img|span|p|a)/i.test(trimmed)) return line;
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
        if (this.registry.footnotes.length) {
            const items = this.registry.footnotes.map(n => 
                `<li id="footnote-${n.id}">${n.metadata.content.trim()} <a href="#fnref-${n.id}" class="ww-backref">↩</a></li>`
            ).join('');
            html += `<section class="ww-end-matter"><h3>Footnotes</h3><ol>${items}</ol></section>`;
        }
        if (this.registry.bibliography.length) {
            const items = this.registry.bibliography.map(b => 
                `<li id="citation-${b.id}"><span class="ww-bib-num">[${b.number}]</span> ${b.metadata.content.trim()}</li>`
            ).join('');
            html += `<section class="ww-end-matter"><h3>Bibliography</h3><ul class="ww-bib-list">${items}</ul></section>`;
        }
        return html;
    }
}