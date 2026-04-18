# WordWriterID

An adaptive Markdown engine designed for technical and academic writing. 

## Key Features
- **Smart IDs:** Everything is referenced via `[..id]` syntax.
- **Hierarchical Sections:** Automatic `1.1.2` numbering for headers.
- **Academic Blocks:** Native support for KaTeX math, CSV tables, and Prism.js code blocks.
- **End-Matter:** Automated bibliography and footnote generation.

-----

## 🛠️ Installation & Development

### 1\. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [Python](https://www.python.org/) installed on your machine.

### 2\. Setup

Clone the repository and install the rendering dependencies (KaTeX, PapaParse, Prism.js):

```bash
git clone https://github.com/shonczinner/wordwriterid.git
cd wordwriterid
npm install
```

### 3\. Running the Demo

To test the engine in a live browser environment with real-time rendering, run:

```bash
npm run demo
```

*This command starts a local Python server at `port 8000` and attempts to open the demo page automatically.*

### 4\. Direct Node Execution

To run the main logic via Node.js directly:

```bash
npm run main
```

-----

## 📄 View Rendered Specification

If you just want to see what the engine is capable of without running it locally, check out our pre-rendered test output:

👉 [**View Rendered Output (HTML Preview)**](https://htmlpreview.github.io/?https://github.com/shonczinner/wordwriterid/blob/main/demo/test_output.html)

-----
