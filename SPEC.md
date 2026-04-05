# Flowchart Maker Specification (SPEC.md)

This document outlines the technical architecture, API design, and data structures for the Flowchart Maker application.

## 1. Technical Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Premium Aesthetics)
- **Flowchart Rendering**: Mermaid.js
- **Interactive Editing**: React Flow (for manual repositioning and node management)
- **State Management**: React Context or Zustand

### Backend
- **Runtime**: Node.js (Express)
- **Code Parsing**: `web-tree-sitter` (WASM) for multi-language support (JS, TS, Python, C++, Java)
- **AI/ML**: 
    - Gemini 1.5 Pro / GPT-4V for Image Parsing (Vision)
    - Structured LLM prompting for Text Parsing
- **Validation**: Mermaid parser/validator

## 2. API Design

### POST `/api/parse-image`
- **Request**: FormData (Image file)
- **Processing**: Vision model detects shapes, arrows, and OCRs text. Post-processed into structured nodes/edges.
- **Response**: `FlowchartData` (JSON) + `mermaid_code` (String)

### POST `/api/parse-code`
- **Request**: `{ code: string, language: string }`
- **Processing**: Tree-sitter AST extraction -> CFG (Control Flow Graph) generation.
- **Response**: `FlowchartData` (JSON) + `mermaid_code` (String)

### POST `/api/parse-text`
- **Request**: `{ description: string }`
- **Processing**: LLM converts NL to a structured graph representation.
- **Response**: `FlowchartData` (JSON) + `mermaid_code` (String)

### POST `/api/validate`
- **Request**: `{ mermaid_code: string }`
- **Processing**: Runs Mermaid syntax check and connectivity validation.
- **Response**: `{ valid: boolean, errors: string[], fixes: string[] }`

## 3. Data Structures

The application uses a unified internal representation for flowcharts:

```typescript
type NodeType = 'start' | 'process' | 'decision' | 'end' | 'input' | 'output';

interface FlowNode {
  id: string;
  type: NodeType;
  text: string;
  position?: { x: number, y: number };
}

interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string; // e.g., "Yes", "No", "Error"
}

interface FlowchartData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
```

### Constraints:
- Decisions MUST have exactly 2 edges (labeled "Yes"/"No" or "True"/"False").
- Exactly one `start` node.
- All nodes must be reachable from `start`.

## 4. Accuracy Validation Strategy

To ensure precision, every generated flowchart undergoes a "Validation Loop":

1.  **Syntax Check**: Mermaid `parse()` must succeed.
2.  **Uniqueness check**: All Node IDs must be unique.
3.  **Connectivity check**: Breadth-First Search (BFS) to ensure 100% reachability from Start.
4.  **Dangling Edge check**: Ensure every target exists.
5.  **LLM Self-Correction**: If any automated check fails, the error log is sent back to the LLM for a "repair" pass before returning to the user.

## 5. UI/UX Design

- **Split Screen**: Visual Preview (Mermaid/React Flow) on the right, Input/Editor on the left.
- **Premium Aesthetics**: Dark mode, glassmorphism, smooth animations between flowchart states.
- **Manual Overrides**: Users can click nodes/edges to edit text or delete connections.
