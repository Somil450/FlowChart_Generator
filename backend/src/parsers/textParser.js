const peggy = require('peggy');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

// Load and Compile Grammar
const grammarPath = path.join(__dirname, 'flowchart.pegjs');
const grammar = fs.readFileSync(grammarPath, 'utf8');
const parser = peggy.generate(grammar);

/**
 * Text -> Flowchart (Deterministic Grammar)
 * 1. LLM translates NL into strict Peggy syntax.
 * 2. Peggy parser constructs the flowchart 100% deterministically.
 */
async function parseText(description) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Translate the following process description into the strict "Flowchart Grammar" (BNF).
    Process: "${description}"
    
    Syntax Requirements:
    1. Define Nodes: "id type 'text', id type 'text', ..." (types: start|process|decision|end)
    2. Define Edges: "id --> id ; id -->(label) id ; ..."
    
    Example Output:
    n1 start "Login", n2 decision "Valid?", n3 process "Dashboard", n4 end "Error"
    n1 --> n2 ; n2 -->(Yes) n3 ; n2 -->(No) n4
    
    Translate ONLY:
  `;

  const result = await model.generateContent(prompt);
  const grammarStr = result.response.text().trim();
  
  try {
    const data = parser.parse(grammarStr);
    return data;
  } catch (err) {
    throw new Error(`Grammar Conversion Failed: ${err.message}. LLM provided: ${grammarStr}`);
  }
}

module.exports = { parseText };
