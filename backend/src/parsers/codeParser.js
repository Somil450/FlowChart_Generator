const { Parser } = require('acorn');
const esgraph = require('esgraph');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Deterministic Code -> Flowchart Parser
 * Supports JavaScript (via Acorn/esgraph) and Python (via native ast module).
 */
async function parseCode(code, language) {
  if (language === 'javascript' || language === 'typescript') {
    return parseJavaScript(code);
  } else if (language === 'python') {
    return parsePython(code);
  } else if (language === 'rust') {
    return parseRust(code);
  } else {
    throw new Error(`Language ${language} not supported for deterministic parsing.`);
  }
}

function parseJavaScript(code) {
  const ast = Parser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
  const cfg = esgraph(ast);
  
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // 1. Process Nodes
  cfg[2].forEach((cfgNode, index) => {
    const id = `n${index}`;
    const type = cfgNode.type === 'exit' ? 'end' : (cfgNode.ast?.type === 'IfStatement' ? 'decision' : 'process');
    const text = cfgNode.ast ? code.substring(cfgNode.ast.start, cfgNode.ast.end).trim() : cfgNode.type;
    
    const nodeObj = { id, type, text: text.substring(0, 50) + (text.length > 50 ? '...' : '') };
    nodes.push(nodeObj);
    nodeMap.set(cfgNode, id);
  });

  // 2. Process Edges
  cfg[2].forEach((cfgNode) => {
    const fromId = nodeMap.get(cfgNode);
    if (cfgNode.next) {
      cfgNode.next.forEach((nextCfgNode, labelIndex) => {
        const toId = nodeMap.get(nextCfgNode);
        const label = cfgNode.ast?.type === 'IfStatement' ? (labelIndex === 0 ? 'Yes' : 'No') : '';
        edges.push({ from: fromId, to: toId, label });
      });
    }
  });

  return { nodes, edges };
}

function parsePython(code) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'pythonCfg.py');
    const child = spawn('python', [pythonScript]);
    
    let output = '';
    let errorOutput = '';

    child.stdin.write(code);
    child.stdin.end();

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { errorOutput += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
        return;
      }
      try {
        const result = JSON.parse(output);
        if (result.error) reject(new Error(result.error));
        else resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });
  });
}

module.exports = { parseCode };
function parseRust(code) {
  return new Promise((resolve, reject) => {
    // 100% Deterministic Rust MIR Parsing
    // We save to a temp file and run rustc
    const tempFile = path.join(__dirname, 'temp.rs');
    fs.writeFileSync(tempFile, code);
    
    const child = spawn('rustc', ['--emit=mir', '-o', '-', tempFile]);
    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => { output += data.toString(); });
    child.stderr.on('data', (data) => { errorOutput += data.toString(); });

    child.on('close', () => {
      fs.unlinkSync(tempFile);
      // Rough parser for MIR structure:
      // bb0: { ... } -> [return: bb1, cleanup: bb2]
      const nodes = [];
      const edges = [];
      const lines = output.split('\n');
      
      let currentBB = null;
      lines.forEach(line => {
        const bbMatch = line.match(/(bb\d+):/);
        if (bbMatch) {
            currentBB = bbMatch[1];
            nodes.push({ id: currentBB, type: 'process', text: `Basic Block ${currentBB}` });
        }
        const edgeMatch = line.match(/goto -> (bb\d+)/);
        if (edgeMatch && currentBB) {
            edges.append({ from: currentBB, to: edgeMatch[1] });
        }
      });

      if (nodes.length === 0) resolve({ nodes: [{id: 'n1', type: 'start', text: 'Parse Error or No Blocks'}], edges: [] });
      else resolve({ nodes, edges });
    });
  });
}
