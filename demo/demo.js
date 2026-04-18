import { WordWriterID } from '../src/index.js';

const ww = new WordWriterID();
const inputArea = document.getElementById('input');
const outputDiv = document.getElementById('output');

function updatePreview() {
    const rawText = inputArea.value;
    // Process the text through our engine
    const html = ww.render(rawText);
    // Inject into the "Paper"
    outputDiv.innerHTML = html;
}

async function loadSampleText() {
    const textarea = document.getElementById('input');
    
    try {
        // Replace 'sample.txt' with your actual file path
        const response = await fetch('./test_input.txt');
        
        if (!response.ok) throw new Error('File not found');
        
        const text = await response.text();
        textarea.value = text;

        updatePreview();
    } catch (err) {
        console.error("Could not load sample file:", err);
    }
}

// Call it when the page loads
window.addEventListener('DOMContentLoaded', loadSampleText);

// Listen for typing
inputArea.addEventListener('input', updatePreview);

// Initial render on load
updatePreview();