/**
 * WordWriterID: Static Build Script
 * Generates a self-contained test_output.html by combining:
 * 1. The rendered content from test_input.txt
 * 2. Inlined CSS from demo.css for portability
 * 3. CDN-linked assets for KaTeX and Prism
 */

import fs from 'fs';
import path from 'path';
import { WordWriterID } from '../src/index.js';

const engine = new WordWriterID();

// Define Paths
const inputPath = path.resolve('demo/test_input.txt');
const cssPath = path.resolve('demo/demo.css');
const outputPath = path.resolve('demo/test_output.html');

try {
    // 1. Read source files
    console.log(`Reading input from: ${inputPath}`);
    const input = fs.readFileSync(inputPath, 'utf8');
    
    console.log(`Reading styles from: ${cssPath}`);
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // 2. Generate the core content
    console.log('Rendering content...');
    const renderedContent = engine.render(input);

    // 3. Wrap in a full HTML template
    // We wrap the content in #preview-container and .paper to match 
    // the layout logic defined in your demo.css.
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordWriterID Test Output</title>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    
    <style>
        /* WordWriterID Inlined Styles */
        ${cssContent}

        /* Adjust the preview container for a single-page view */
        #preview-container {
            width: 100% !important;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="preview-container">
        <div class="paper">
            ${renderedContent}
        </div>
    </div>
</body>
</html>
`;

    // 4. Write to file
    fs.writeFileSync(outputPath, fullHtml, 'utf8');
    console.log('------------------------------------------');
    console.log('✅ Successfully generated test_output.html');
    console.log(`📍 Location: ${outputPath}`);
    console.log('------------------------------------------');

} catch (err) {
    console.error('❌ Build Failed:');
    if (err.code === 'ENOENT') {
        console.error(`   Could not find file: ${err.path}`);
    } else {
        console.error(`   ${err.message}`);
    }
    process.exit(1);
}