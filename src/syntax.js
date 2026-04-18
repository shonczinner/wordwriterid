/**
 * WordWriterID: Syntax Specification
 * Updated with Academic Metadata Suite (Unreferenced)
 */
export const Specification = {
    utils: { reference: "[..ID]" },
    blocks: {
        // --- UNREFERENCED METADATA BLOCKS ---
        title: {
            syntax: "Title: TITLE",
            render: (g) => `<h1 class="ww-main-title">${g.title}</h1>`
        },
        subtitle: {
            syntax: "Subtitle: TITLE",
            render: (g) => `<h2 class="ww-main-subtitle">${g.title}</h2>`
        },
        authors: {
            syntax: "Authors: TITLE",
            render: (g) => `<div class="ww-main-authors">${g.title}</div>`
        },
        // --- Inside Specification.blocks ---
        abstract: {
            /* TRICK: We use the 'TITLE' placeholder here instead of 'CONTENT'.
            Since 'TITLE' captures everything until the first newline [^\n]*,
            it perfectly grabs a single-paragraph abstract without accidentally 
            eating the rest of the document. 
            */
            syntax: "Abstract: TITLE", 
            render: (g) => `
                <div class="ww-abstract-container">
                    <div class="ww-abstract-header">Abstract</div>
                    <div class="ww-abstract-content">${g.title.trim()}</div>
                </div>`
        },

        blockquote: {
            /*
            TRICK: Using 'TITLE' here as well allows for a single-line 
            "Blockquote: My quote" syntax. If you need multi-line blockquotes,
            you'd have to switch this back to 'CONTENT' and ensure a double-newline terminator.
            */
            syntax: "Blockquote: TITLE",
            render: (g) => `<blockquote class="ww-styled-blockquote">${g.title.trim()}</blockquote>`
        },
        keywords: {
            syntax: "Keywords: TITLE",
            render: (g) => {
                // Split by comma, trim whitespace, and wrap each in a span
                const tags = g.title.split(',')
                    .map(t => `<span class="ww-tag">${t.trim()}</span>`)
                    .join(''); // Join with nothing, CSS will add the commas
                return `<div class="ww-keywords-row"><strong>Keywords:</strong> ${tags}</div>`;
            }
        },

        // --- REFERENCED BLOCKS (EXISTING) ---
        section: {
            syntax: "LEVEL[..ID] TITLE",
            ref: (num) => `Section ${num.join('.')}`,
            render: (g, e) => {
                const tag = `h${g.level.length}`;
                const idAttr = g.id ? ` id="section-${g.id}"` : '';
                const label = e.numbers ? `${e.numbers.join('.')} ` : '';
                return `<${tag}${idAttr}>${label}${g.title}</${tag}>`;
            }
        },
        equation: {
            syntax: "$$[..ID]CONTENT$$",
            ref: (num) => `Equation ${num}`,
            render: (g, e, math) => {
                const idAttr = g.id ? ` id="equation-${g.id}"` : '';
                const numLabel = e.number ? `<span class="ww-math-number">(${e.number})</span>` : '';
                return `<div${idAttr} class="ww-math-block"><div class="ww-math-content">${math}</div>${numLabel}</div>`;
            }
        },
        table: {
            syntax: "```csv[..ID]TITLE\nCONTENT```",
            ref: (num) => `Table ${num}`,
            render: (g, e, html) => {
                const idAttr = g.id ? ` id="table-${g.id}"` : '';
                const captionLabel = e.number ? `Table ${e.number}: ` : '';
                return `<div${idAttr} class="ww-table-container"><div class="ww-table-caption">${captionLabel}${g.title}</div>${html}</div>`;
            }
        },
        algorithm: {
            syntax: "```LANG[..ID]TITLE\nCONTENT```",
            ref: (num) => `Algorithm ${num}`,
            render: (g, e, code) => {
                const idAttr = g.id ? ` id="algorithm-${g.id}"` : '';
                const headerLabel = e.number ? `Algorithm ${e.number}: ` : '';
                return `<div${idAttr} class="ww-code-block"><div class="ww-code-header">${headerLabel}${g.title}</div><pre class="language-${g.lang}"><code>${code}</code></pre></div>`;
            }
        },
        figure: {
            syntax: "![..ID][TITLE](URL)",
            ref: (num) => `Figure ${num}`,
            render: (g, e) => {
                const idAttr = g.id ? ` id="figure-${g.id}"` : '';
                const captionLabel = e.number ? `<strong>Figure ${e.number}:</strong> ` : '';
                return `<div${idAttr} class="ww-figure-container"><img src="${g.url}"><div class="ww-figure-caption">${captionLabel}${g.title}</div></div>`;
            }
        },
        citation: { 
            syntax: "@[..ID](CONTENT)@", 
            ref: (num) => `[${num}]`,
            render: (g, e) => `<a id="citeref-${g.id}" href="#citation-${g.id}" class="ww-ref-link">[${e.number}]</a>`
        },
        footnote: { 
            syntax: "^[..ID](CONTENT)^", 
            ref: (num) => `<sup>${num}</sup>`,
            render: (g, e) => `<a id="fnref-${g.id}" href="#footnote-${g.id}" class="ww-ref-link"><sup>${e.number}</sup></a>`
        }
    }
};

class SyntaxFactory {
    constructor(spec) {
        this.spec = spec;
        this.map = {};
        this.utils = {};
        this._build();
    }
    _escape(str) { return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); }
    _generate(template) {
        let pattern = this._escape(template)
            .replace('LEVEL', '(?<level>#{1,3})')
            .replace('\\[\\.\\.ID\\]', '(?:\\[\\.\\.(?<id>[^\\s\\]]+)\\])?')
            .replace('\\(CONTENT\\)', '(?:\\((?<refContent>.*?)\\))?') 
            .replace('CONTENT', '(?<content>[\\s\\S]*?)') // Changed to support newlines
            .replace('TITLE', '(?<title>[^\\n]*)')
            .replace('LANG', '(?<lang>\\w+)')
            .replace('URL', '(?<url>.*?)')
            .replace('\\n', '\\n');
        return new RegExp(pattern, 'gs');
    }
    _build() {
        for (let key in this.spec.blocks) {
            this.map[key] = { regex: this._generate(this.spec.blocks[key].syntax), ...this.spec.blocks[key] };
        }
        this.utils.reference = /\[\.\.(?<id>[^\]\s:]+)\]/g;
    }
}
export const EngineSyntax = new SyntaxFactory(Specification);