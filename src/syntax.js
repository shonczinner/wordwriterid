export const Specification = {
    // New utility templates for the factory to process
    utils: {
        reference: "[..ID]",
        // Blocks marked 'vacate: true' will be deleted from body text after discovery
        cleanupTypes: ['citation', 'footnote'] 
    },
    blocks: {
        section: {
            syntax: "LEVEL[..ID] TITLE",
            ref: (num) => `Section ${num.join('.')}`,
            render: (g, e) => `<h${g.level.length} id="section-${g.id}">${e.numbers.join('.')} ${g.title}</h${g.level.length}>`
        },
        equation: {
            syntax: "$$[..ID]CONTENT$$",
            ref: (num) => `Equation ${num}`,
            render: (g, e, math) => `<div id="equation-${g.id}" class="ww-math-block"><div class="ww-math-content">${math}</div><span class="ww-math-number">(${e.number})</span><button class="ww-copy-btn" onclick="copyKaTeX(this)">Copy KaTeX</button></div>`
        },
        table: {
            syntax: "```csv[..ID]TITLE\nCONTENT```",
            ref: (num) => `Table ${num}`,
            render: (g, e, html) => `<div id="table-${g.id}" class="ww-table-container"><div class="ww-table-caption">Table ${e.number}: ${g.title}</div>${html}<button class="ww-copy-btn" onclick="copyCSV(this)">Copy CSV</button></div>`
        },
        algorithm: {
            syntax: "```LANG[..ID]TITLE\nCONTENT```",
            ref: (num) => `Algorithm ${num}`,
            render: (g, e, code) => `<div id="algorithm-${g.id}" class="ww-code-block"><div class="ww-code-header">Algorithm ${e.number}: ${g.title}</div><pre class="language-${g.lang}"><code>${code}</code></pre><button class="ww-copy-btn" onclick="copyCode(this)">Copy Code</button></div>`
        },
        figure: {
            syntax: "![..ID][TITLE](URL)",
            ref: (num) => `Figure ${num}`,
            render: (g, e) => `<div id="figure-${g.id}" class="ww-figure-container"><img src="${g.url}"><div class="ww-figure-caption"><strong>Figure ${e.number}:</strong> ${g.title}</div></div>`
        },
        // Referencable Lists
        list: {
            syntax: "TYPE[..ID]TITLE", // TYPE will be 'ordered' or 'unordered'
            ref: (num) => `List ${num}`,
            render: (g, e, content) => `<div class="ww-list-container"><strong>List ${e.number}${g.title ? ': ' + g.title : ''}</strong><${g.type === 'ordered' ? 'ol' : 'ul'} id="list-${g.id}">${content}</${g.type === 'ordered' ? 'ol' : 'ul'}></div>`
        },
        listItem: {
            syntax: "* [..ID] CONTENT",
            ref: (num) => `Item ${num.join('.')}`,
            render: (g, e) => `<li id="item-${g.id}">${g.content}</li>`
        },
        citation: { 
            syntax: "@[..ID](CONTENT)@", 
            vacate: true,
            ref: (num) => `[${num}]`,
            render: (id, num, content) => `<li id="citation-${id}"><span class="ww-bib-num">[${num}]</span> ${content.trim()}</li>`
        },
        footnote: { 
            syntax: "^[..ID](CONTENT)^", 
            vacate: true,
            ref: (num) => `<sup>${num}</sup>`,
            render: (id, num, content) => `<li id="footnote-${id}">${content.trim()} <a href="#fnref-${id}" class="ww-backref">↩</a></li>`
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
            .replace('TYPE', '(?<type>ordered|unordered)')
            .replace('\\[\\.\\.ID\\]', '\\[\\.\\.(?<id>[^\\s\\]]+)\\]')
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
        // Build the universal reference regex from the human-readable [..ID]
        this.utils.reference = this._generate(this.spec.utils.reference);
        this.utils.cleanupTypes = this.spec.utils.cleanupTypes;
    }
}

export const EngineSyntax = new SyntaxFactory(Specification);