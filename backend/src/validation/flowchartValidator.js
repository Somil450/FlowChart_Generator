/**
 * Advanced Flowchart Validation
 * 1. Cycle detection
 * 2. Multi-start detection
 * 3. Dead code / Reachability
 * 4. Label completeness for decisions
 */
function validateFlowchart(data) {
  const { nodes, edges } = data;
  const errors = [];
  const warnings = [];
  const fixes = [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj = new Map(nodes.map(n => [n.id, []]));
  const revAdj = new Map(nodes.map(n => [n.id, []]));
  edges.forEach(e => {
    if (adj.has(e.from)) adj.get(e.from).push(e.to);
    if (revAdj.has(e.to)) revAdj.get(e.to).push(e.from);
  });

  // 1. Single Start Node
  const startNodes = nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) errors.push('No start node found.');
  if (startNodes.length > 1) errors.push(`Multiple start nodes detected: ${startNodes.map(n => n.id).join(', ')}`);

  // 2. Reachability & Dead Code (BFS from all starts)
  const reachable = new Set();
  const queue = startNodes.map(n => n.id);
  queue.forEach(id => reachable.add(id));

  while (queue.length > 0) {
    const curr = queue.shift();
    (adj.get(curr) || []).forEach(next => {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    });
  }

  const unreachable = nodes.filter(n => !reachable.has(n.id));
  if (unreachable.length > 0) {
    errors.push(`Dead code detected (unreachable): ${unreachable.map(n => n.id).join(', ')}`);
  }

  // 3. Cycle Detection (DFS)
  const visited = new Set();
  const recStack = new Set();
  let hasCycle = false;

  function isCyclic(id) {
    visited.add(id);
    recStack.add(id);
    for (const next of (adj.get(id) || [])) {
      if (!visited.has(next)) {
        if (isCyclic(next)) return true;
      } else if (recStack.has(next)) {
        return true;
      }
    }
    recStack.delete(id);
    return false;
  }

  startNodes.forEach(s => {
    if (!visited.has(s.id)) {
      if (isCyclic(s.id)) hasCycle = true;
    }
  });

  if (hasCycle) warnings.push('Cycle detected in graph logic.');

  // 4. Decision Label Completeness
  nodes.filter(n => n.type === 'decision').forEach(n => {
    const outgoing = edges.filter(e => e.from === n.id);
    if (outgoing.length < 2) {
      errors.push(`Decision node ${n.id} MUST have at least 2 outgoing edges.`);
    }
    outgoing.forEach(e => {
      if (!e.label) {
        errors.push(`Missing label for edge from decision node ${n.id} to ${e.to}. (Requires Yes/No)`);
        // Auto-fix: try to infer label
        e.label = outgoing.indexOf(e) === 0 ? 'Yes' : 'No';
        fixes.push(`Auto-labeled edge ${n.id}->${e.to} as ${e.label}`);
      }
    });
  });

  return {
    is_valid: errors.length === 0,
    errors,
    warnings,
    fixes_applied: fixes
  };
}

module.exports = { validateFlowchart };
