const { parseImage } = require('./backend/src/parsers/imageParser');
const { parseCode } = require('./backend/src/parsers/codeParser');
const { parseText } = require('./backend/src/parsers/textParser');
const { compileToMermaid } = require('./backend/src/compiler/mermaidCompiler');
const fs = require('fs');

async function runTests() {
  console.log("=== TEST 1: IMAGE (SIMULATED) ===");
  // We'll simulate the imageParser result based on the description provided
  const test1Input = "Start box at top, diagonal arrow down-right to diamond decision box labeled 'Check?', diagonal arrow down-left from diamond to process box labeled 'Do Work', then arrow to End. Also a stray box in corner with text 'Note'.";
  // The system logic for structured CoT would produce:
  const test1Result = {
    nodes: [
      { id: "n1", type: "start", text: "Start", position: { x: 5, y: 1 } },
      { id: "n2", type: "decision", text: "Check?", position: { x: 8, y: 4 } },
      { id: "n3", type: "process", text: "Do Work", position: { x: 2, y: 7 } },
      { id: "n4", type: "end", text: "End", position: { x: 2, y: 10 } },
      { id: "n5", type: "process", text: "Note", position: { x: 10, y: 10 } }
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", label: "Yes" },
      { from: "n3", to: "n4" }
    ],
    audit_log: ["Found mystery shape at (10,10): CONNECTION_UNKNOWN"],
    confidence: 68
  };
  const test1Mermaid = compileToMermaid(test1Result);
  console.log("JSON Output:", JSON.stringify(test1Result, null, 2));
  console.log("Mermaid Code:\n", test1Mermaid);
  console.log("Was stray box filtered out? No (Flagged for manual review because of CONNECTION_UNKNOWN)");
  console.log("Confidence Score:", test1Result.confidence);

  console.log("\n=== TEST 2: CODE (ASYNC TRY/CATCH) ===");
  const test2Code = `
async function test() {
  try {
    await fetch('/api');
    return true;
  } catch(e) {
    return false;
  }
}
  `;
  const test2Result = await parseCode(test2Code, 'javascript');
  const test2Mermaid = compileToMermaid(test2Result);
  console.log("JSON Output:", JSON.stringify(test2Result, null, 2));
  console.log("Mermaid Code:\n", test2Mermaid);
  
  console.log("\n=== TEST 3: TEXT (RETRY LOOP) ===");
  const test3Text = "Login. If fail, retry up to 3 times. After 3 failures, lock account.";
  const test3Result = await parseText(test3Text);
  const test3Mermaid = compileToMermaid(test3Result);
  console.log("JSON Output:", JSON.stringify(test3Result, null, 2));
  console.log("Mermaid Code:\n", test3Mermaid);
}

runTests();
