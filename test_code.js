const { Parser } = require('web-tree-sitter');
const { parseCode } = require('./backend/src/parsers/codeParser');
const { validateFlowchart } = require('./backend/src/validation/flowchartValidator');
const { compileToMermaid } = require('./backend/src/compiler/mermaidCompiler');

const code = `
async function fetchData(id) {
  let data = null;
  try {
    const response = await fetch(\`/api/\${id}\`);
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}\`);
    }
    data = await response.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    return { error: err.message };
  }
  
  if (data?.valid) {
    await saveToCache(data);
    return data;
  }
  
  return { error: "Invalid data" };
}
`;

(async () => {
  try {
    const result = await parseCode(code, 'javascript');
    const validation = validateFlowchart(result);
    const mermaid = compileToMermaid(result);

    console.log("--- RESULT ---");
    console.log(JSON.stringify({
      mermaid_code: mermaid,
      validation_passed: validation.is_valid,
      errors: validation.errors,
      warnings: validation.warnings,
      fixes: validation.fixes_applied
    }, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
