import fs from 'fs';
import path from 'path';
import { WordWriterID } from '../src/index.js';

const engine = new WordWriterID();

const inputPath = path.resolve('demo/test_input.txt');
const input = fs.readFileSync(inputPath, 'utf8');
console.log(`Reading input from: ${inputPath}`);

// 1. Generate the content
const renderedContent = engine.render(input);

// 2. Wrap in a full HTML template so it looks good in the browser
const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WordWriterID Test Output</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="demo.css">
</head>
<body>
    ${renderedContent}
</body>
</html>
`;

// 3. Write to file
try {
    fs.writeFileSync('demo/test_output.html', fullHtml, 'utf8');
    console.log('Successfully generated test_output.html');
} catch (err) {
    console.error('Error writing file:', err);
}