/**
 * WordWriterID: Syntax Specification
 */
export const Specification = {
    utils: { reference: "[..ID]" },
    inline: {
        // [Link Text](URL)
        hyperlink: {
        syntax: "[TITLE](URL)",
        render: (g) => {
            let url = g.url.trim();

            // strip angle brackets if present
            if (url.startsWith("<") && url.endsWith(">")) {
            url = url.slice(1, -1);
            }

            const href = /^(http|https|#|\/)/.test(url)
            ? url
            : `https://${url}`;

            return `<a href="${href}" class="ww-ext-link" target="_blank" rel="noopener">${g.title}</a>`;
        }
        }
    },
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
        abstract: {
            syntax: "Abstract: TITLE", 
            render: (g) => `
                <div class="ww-abstract-container">
                    <div class="ww-abstract-header">Abstract</div>
                    <div class="ww-abstract-content">${g.title.trim()}</div></div>`
        },
        blockquote: {
            syntax: "```quote[..ID]TITLE\nCONTENT```",
            render: (g, e) => {
                const idAttr = g.id ? ` id="blockquote-${g.id}"` : '';
                const caption = g.title ? `<cite class="ww-blockquote-caption">— ${g.title}</cite>` : '';
                
                // Clean the content and replace internal newlines with <br> 
                // to prevent simpleMarkdown from splitting it into paragraphs.
                const body = g.content.trim().split('\n').join('<br>');

                return `<blockquote${idAttr} class="ww-styled-blockquote">${body}${caption}</blockquote>`;
            }
        },
        keywords: {
            syntax: "Keywords: TITLE",
            render: (g) => {
                const tags = g.title.split(',')
                    .map(t => `<span class="ww-tag">${t.trim()}</span>`)
                    .join('');
                return `<div class="ww-keywords-row"><strong>Keywords:</strong> ${tags}</div>`;
            }
        },

        // --- REFERENCED & SPECIAL BLOCKS ---
        inlineMath: {
            syntax: "\\(CONTENT\\)", 
            render: (g, e, math) => `<span class="ww-inline-math">${math}</span>`
        },
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
            syntax: "\\[[..ID]CONTENT\\]",
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
            // We explicitly list the languages. 'code' is the generic fallback.
            syntax: "```(?<lang>js|javascript|python|html|css|sql|bash|code)[..ID]TITLE\nCONTENT```",
            ref: (num) => `Algorithm ${num}`,
            render: (g, e, code) => {
                const idAttr = g.id ? ` id="algorithm-${g.id}"` : '';
                const headerLabel = e.number ? `Algorithm ${e.number}: ` : '';
                // Map 'code' to 'javascript' or 'none' for Prism highlighting
                const prismLang = g.lang === 'code' ? 'javascript' : g.lang;
                return `<div${idAttr} class="ww-code-block"><div class="ww-code-header">${headerLabel}${g.title}</div><pre class="language-${prismLang}"><code>${code}</code></pre></div>`;
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

    _escape(str) { 
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
    }

    _generate(template, isUtil = false) {
        let pattern = this._escape(template)
            .replace('LEVEL', '(?<level>#{1,3})')
            // For blocks, ID is optional (?:...). For utils (references), it's usually mandatory.
            .replace('\\[\\.\\.ID\\]', isUtil ? '\\[\\.\\.(?<id>[^\\s\\]]+)\\]' : '(?:\\[\\.\\.(?<id>[^\\s\\]]+)\\])?')
            .replace('\\(CONTENT\\)', '(?:\\((?<refContent>.*?)\\))?') 
            .replace('CONTENT', '(?<content>[\\s\\S]*?)')
            .replace('TITLE', '(?<title>[^\\n]*)')
            .replace('LANG', '(?<lang>[\\w|]+)')
            .replace('URL', '(?<url><[^>]+>|[^\\s\\)]+)')
            .replace('\\n', '\\n');

        // Utils usually need to be found globally within strings, 
        // while blocks use 'gs' for discovery.
        return new RegExp(pattern, isUtil ? 'g' : 'gs');
    }

    _build() {
        // 1. Build Blocks
        for (let key in this.spec.blocks) {
            this.map[key] = { 
                ...this.spec.blocks[key], 
                regex: this._generate(this.spec.blocks[key].syntax) 
            };
        }

        // 2. Build Utils
        for (let key in this.spec.utils) {
            this.utils[key] = this._generate(this.spec.utils[key], true);
        }

        // 3. Build Inline Rules (Hyperlinks, etc.)
        this.inline = {};
        for (let key in this.spec.inline) {
            this.inline[key] = {
                ...this.spec.inline[key],
                regex: this._generate(this.spec.inline[key].syntax)
            };
        }
    }
}

export const EngineSyntax = new SyntaxFactory(Specification);