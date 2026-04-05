/**
 * Perfect Flowchart Validator
 * Enforces 100% structural integrity rules.
 */
function validatePerfect(data) {
  const { nodes, edges } = data;
  const errors = [];
  const warnings = [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map(nodes.map(n => [n.id, []]));
  edges.forEach(e => {
    if (adj.has(e.from)) adj.get(e.from).push(e.to);
  });

  // 1. Single Start Node
  const startNodes = nodes.filter(n => n.type === 'start');
  if (startNodes.length !== 1) errors.push(`ERROR: Exactly ONE start node required. Found ${startNodes.length}.`);

  // 2. Single End Node (or Exit point)
  const endNodes = nodes.filter(n => n.type === 'end' || n.type === 'exit');
  if (endNodes.length < 1) warnings.push(`WARNING: No explicit 'end' node found.`);

  // 3. Decision Node Integrity (exactly 2 outgoing edges)
  nodes.filter(n => n.type === 'decision').forEach(n => {
    const outgoing = edges.filter(e => e.from === n.id);
    if (outgoing.length !== 2) {
      errors.push(`ERROR: Decision node ${n.id} ("${n.text}") must have exactly 2 outgoing edges. Found ${outgoing.length}.`);
    }
  });

  // 4. Reachability (BFS from start)
  if (startNodes.length === 1) {
    const reachable = new Set();
    const queue = [startNodes[0].id];
    reachable.add(startNodes[0].id);

    while (queue.length > 0) {
      const curr = queue.shift();
      (adj.get(curr) || []).forEach(next => {
        if (!reachable.has(next)) {
          reachable.add(next);
          queue.push(next);
        }
      });
    }

    if (reachable.size < nodes.length) {
      const disconnected = nodes.filter(n => !reachable.has(n.id));
      errors.push(`ERROR: Disconnected nodes detected: ${disconnected.map(n => n.id).join(', ')}`);
    }
  }

  // 5. Unique IDs & Edge Integrity
  const ids = new Set();
  nodes.forEach(n => {
    if (ids.has(n.id)) errors.push(`ERROR: Duplicate ID ${n.id}`);
    ids.add(n.id);
  });
  edges.forEach(e => {
    if (!nodeMap.has(e.from)) errors.push(`ERROR: Edge from non-existent node ${e.from}`);
    if (!nodeMap.has(e.to)) errors.push(`ERROR: Edge to non-existent node ${e.to}`);
  });

  return { is_valid: errors.length === 0, errors, warnings };
}

module.exports = { validatePerfect };
