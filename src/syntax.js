/**
 * WordWriterID: Syntax Specification & Factory
 * * Defines the regex patterns and rendering logic for all document blocks.
 * * Citations and Footnotes are now 'inline-blocks': they render a reference 
 * label [N] at the site of declaration while storing metadata for the end-matter.
 */

export const Specification = {
    utils: {
        // Strict catch for [..ID] cross-references
        reference: "[..ID]"
    },
    blocks: {
        section: {
            syntax: "LEVEL[..ID] TITLE",
            ref: (num) => `Section ${num.join('.')}`,
            render: (g, e) => `<h${g.level.length} id="section-${g.id || 'anon'}">${e.numbers.join('.')} ${g.title}</h${g.level.length}>`
        },
        equation: {
            syntax: "$$[..ID]CONTENT$$",
            ref: (num) => `Equation ${num}`,
            render: (g, e, math) => `<div id="equation-${g.id || 'anon'}" class="ww-math-block"><div class="ww-math-content">${math}</div><span class="ww-math-number">(${e.number})</span></div>`
        },
        table: {
            syntax: "```csv[..ID]TITLE\nCONTENT```",
            ref: (num) => `Table ${num}`,
            render: (g, e, html) => `<div id="table-${g.id}" class="ww-table-container"><div class="ww-table-caption">Table ${e.number}: ${g.title}</div>${html}</div>`
        },
        algorithm: {
            syntax: "```LANG[..ID]TITLE\nCONTENT```",
            ref: (num) => `Algorithm ${num}`,
            render: (g, e, code) => `<div id="algorithm-${g.id}" class="ww-code-block"><div class="ww-code-header">Algorithm ${e.number}: ${g.title}</div><pre class="language-${g.lang}"><code>${code}</code></pre></div>`
        },
        figure: {
            syntax: "![..ID][TITLE](URL)",
            ref: (num) => `Figure ${num}`,
            render: (g, e) => `<div id="figure-${g.id}" class="ww-figure-container"><img src="${g.url}"><div class="ww-figure-caption"><strong>Figure ${e.number}:</strong> ${g.title}</div></div>`
        },
        citation: { 
            syntax: "@[..ID](CONTENT)@", 
            ref: (num) => `[${num}]`,
            // Renders the link [N] at the declaration site
            render: (g, e) => `<a id="citeref-${g.id}" href="#citation-${g.id}" class="ww-ref-link">[${e.number}]</a>`
        },
        footnote: { 
            syntax: "^[..ID](CONTENT)^", 
            ref: (num) => `<sup>${num}</sup>`,
            // Renders the superscript link at the declaration site
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

    /**
     * Escapes special characters for use in a Regular Expression
     */
    _escape(str) { 
        return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); 
    }

    /**
     * Converts a simplified syntax template into a robust Named Capture Group Regex
     */
    _generate(template) {
        let pattern = this._escape(template)
            .replace('LEVEL', '(?<level>#{1,3})')
            .replace('TYPE', '(?<type>ordered|unordered)')
            // IDs are optional for Sections and Equations to support unnumbered blocks
            .replace('\\[\\.\\.ID\\]', '(?:\\[\\.\\.(?<id>[^\\s\\]]+)\\])?')
            // Content inside parentheses (for citations/footnotes)
            .replace('\\(CONTENT\\)', '(?:\\((?<refContent>.*?)\\))?') 
            // Content inside blocks (for math/tables/code)
            .replace('CONTENT', '(?<content>.*?)') 
            .replace('TITLE', '(?<title>[^\\n]*)')
            .replace('LANG', '(?<lang>\\w+)')
            .replace('URL', '(?<url>.*?)')
            .replace('\\n', '\\n');
            
        return new RegExp(pattern, 'gs');
    }

    _build() {
        for (let key in this.spec.blocks) {
            this.map[key] = { 
                regex: this._generate(this.spec.blocks[key].syntax),
                ...this.spec.blocks[key]
            };
        }
        
        // Specifically define the cross-reference utility regex
        this.utils.reference = /\[\.\.(?<id>[^\]\s:]+)\]/g;
    }
}

export const EngineSyntax = new SyntaxFactory(Specification);