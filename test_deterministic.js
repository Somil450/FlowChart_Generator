const { parseCode } = require('./backend/src/parsers/codeParser');
const { validatePerfect } = require('./backend/src/validation/perfectValidator');
const { compileToMermaid } = require('./backend/src/compiler/mermaidCompiler');

const code = `
def absolute(x):
    if x < 0:
        return -x
    return x
`;

(async () => {
  try {
    const result = await parseCode(code, 'python');
    const validation = validatePerfect(result);
    const mermaid = compileToMermaid(result);

    console.log("--- DETERMINISTIC RESULT (TEST A) ---");
    console.log(JSON.stringify({
      nodes: result.nodes,
      edges: result.edges,
      mermaid_code: mermaid,
      validation: validation
    }, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
