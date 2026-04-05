/**
 * Flowchart JSON -> Mermaid Compiler
 * Guarantees valid Mermaid syntax and proper character escaping.
 */
function compileToMermaid(data) {
  const { nodes, edges } = data;
  let mermaid = 'flowchart TD\n';

  // Helper: Sanitize ID (no special chars/spaces for IDs)
  const sanitizeId = (id) => id.replace(/[^a-zA-Z0-9]/g, '_');

  // Helper: Escape and Quote Labels
  const formatLabel = (text) => {
    if (!text) return '""';
    // Escape double quotes and wrap in quotes for safety
    return `"${text.replace(/"/g, '\"')}"`;
  };

  // Helper: Map node types to Mermaid shapes
  const getShape = (type, label) => {
    const l = formatLabel(label);
    switch (type) {
      case 'start': return `([${l}])`;
      case 'end': return `([${l}])`;
      case 'decision': return `{${l}}`;
      case 'process': return `[${l}]`;
      case 'oval': return `(${l})`;
      case 'diamond': return `{${l}}`;
      case 'rect': return `[${l}]`;
      case 'input': return `[/${l}/]`;
      case 'output': return `[\\${l}\\]`;
      default: return `[${l}]`;
    }
  };

  // 1. Define Nodes
  nodes.forEach(node => {
    const id = sanitizeId(node.id);
    const shape = getShape(node.type, node.text);
    mermaid += `    ${id}${shape}\n`;
  });

  // 2. Define Edges
  edges.forEach(edge => {
    const from = sanitizeId(edge.from);
    const to = sanitizeId(edge.to);
    const label = edge.label ? `|${edge.label}| ` : '';
    mermaid += `    ${from} --> ${label}${to}\n`;
  });

  return mermaid;
}

module.exports = { compileToMermaid };
