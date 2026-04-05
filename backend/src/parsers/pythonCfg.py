import ast
import json
import sys
import uuid

def get_cfg(source):
    try:
        tree = ast.parse(source)
    except SyntaxError as e:
        return {"error": f"Syntax Error at line {e.lineno}: {e.msg}"}

    nodes = []
    edges = []

    def add_node(node_id, node_type, text):
        if not any(n['id'] == node_id for n in nodes):
            nodes.append({"id": node_id, "type": node_type, "text": text or "..."})
        return node_id

    def add_edge(from_id, to_id, label=None):
        if from_id and to_id and from_id != to_id:
            if not any(e['from'] == from_id and e['to'] == to_id and e['label'] == label for e in edges):
                edges.append({"from": from_id, "to": to_id, "label": label})

    class CFGBuilder:
        def __init__(self):
            self.node_counter = 0

        def get_new_id(self, prefix):
            self.node_counter += 1
            return f"{prefix}_{self.node_counter}"

        def process_statements(self, statements, entry_id):
            curr_id = entry_id
            for stmt in statements:
                next_id = self.visit(stmt, curr_id)
                if next_id:
                    curr_id = next_id
                else:
                    # If visit returns None, it means the flow was terminated (Return/Break)
                    return None
            return curr_id

        def visit(self, node, entry_id):
            if isinstance(node, ast.FunctionDef):
                # We show function contents as the main flow for this app
                start_id = add_node(f"start_{node.name}", "start", f"Function: {node.name}")
                add_edge(entry_id, start_id)
                return self.process_statements(node.body, start_id)

            elif isinstance(node, ast.If):
                cond_text = ast.unparse(node.test)
                cond_id = add_node(self.get_new_id("dec"), "decision", cond_text)
                add_edge(entry_id, cond_id)
                
                # Yes path
                last_yes = self.process_statements(node.body, cond_id)
                # Find the edge from decision to the first body node and label it "Yes"
                for e in edges:
                    if e['from'] == cond_id and not e.get('label'):
                        e['label'] = "Yes"
                        break

                # No path
                if node.orelse:
                    last_no = self.process_statements(node.orelse, cond_id)
                    # Label the first edge of the orelse branch "No"
                    found_no_label = False
                    for e in reversed(edges): # Find the one we just added
                        if e['from'] == cond_id and not e.get('label'):
                            e['label'] = "No"
                            found_no_label = True
                            break
                else:
                    last_no = cond_id # Flow skips body

                # Join the flows
                # If both branches terminate, return None
                if last_yes is None and last_no is None:
                    return None
                
                # Instead of a technical "Merge" node, just pass back the last IDs
                # For simplicity in this UI, we can use a small invisible joiner or 
                # just pick the first non-None path to continue from.
                # Let's use a "Continue" point.
                join_id = add_node(self.get_new_id("join"), "process", "---")
                if last_yes: add_edge(last_yes, join_id)
                if last_no: add_edge(last_no, join_id, "No" if not node.orelse else None)
                return join_id

            elif isinstance(node, ast.While):
                loop_id = add_node(self.get_new_id("loop"), "decision", f"while {ast.unparse(node.test)}")
                add_edge(entry_id, loop_id)
                
                last_body = self.process_statements(node.body, loop_id)
                if last_body:
                    add_edge(last_body, loop_id) # Back-edge
                    # Label the entry to body as "Yes"
                    for e in edges:
                        if e['from'] == loop_id and not e.get('label'):
                            e['label'] = "Yes"
                            break
                            
                return loop_id # Output is the loop exit (implied No)

            elif isinstance(node, ast.Return):
                text = f"return {ast.unparse(node.value)}" if node.value else "return"
                ret_id = add_node(self.get_new_id("ret"), "process", text)
                add_edge(entry_id, ret_id)
                return None # Terminal

            elif isinstance(node, (ast.Assign, ast.Expr, ast.Call, ast.Import, ast.ImportFrom)):
                # Clean up the text for display (remove newlines, truncate)
                raw_text = ast.unparse(node).strip()
                display_text = (raw_text[:40] + '..') if len(raw_text) > 42 else raw_text
                stmt_id = add_node(self.get_new_id("stmt"), "process", display_text)
                add_edge(entry_id, stmt_id)
                return stmt_id

            return entry_id

    builder = CFGBuilder()
    # Find the first FunctionDef or first executable statement as root
    # For scripts, we start at a virtual entry
    root_id = add_node("entry", "start", "Flow Start")
    builder.process_statements(tree.body, root_id)
    
    return {"nodes": nodes, "edges": edges}

if __name__ == "__main__":
    code = sys.stdin.read()
    try:
        result = get_cfg(code)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
