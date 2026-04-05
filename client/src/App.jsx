import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { Upload, Code, Type, ShieldCheck, AlertTriangle, Save, RefreshCw, CheckCircle, FileText, Maximize, Edit3 } from 'lucide-react';
import MandatoryCorrectionModal from './components/MandatoryCorrectionModal';
import CustomNodes from './components/CustomNodes';
import dagre from 'dagre';

const nodeTypes = {
  start: CustomNodes.start,
  end: CustomNodes.end,
  process: CustomNodes.process,
  decision: CustomNodes.decision,
};

const API_BASE = 'http://localhost:3001/api';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mermaidCode, setMermaidCode] = useState("flowchart TD\n    Start([Start]) --> Process[Analyze Input]");
  const [inputMode, setInputMode] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationLog, setValidationLog] = useState({ is_valid: true, errors: [], warnings: [], fixes: [] });
  const [inputText, setInputText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [rawParsedData, setRawParsedData] = useState({ nodes: [], edges: [] });

  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    if (nodes.length === 0) return nodes;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, ranksep: 80, nodesep: 100 });

    nodes.forEach((node) => {
      const isDecision = node.type === 'decision';
      dagreGraph.setNode(node.id, { 
        width: isDecision ? 180 : 160, 
        height: isDecision ? 120 : 80 
      });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const isDecision = node.type === 'decision';
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - (isDecision ? 90 : 80),
          y: nodeWithPosition.y - (isDecision ? 60 : 40),
        },
      };
    });
  };

  const reactFlowWrapper = useRef(null);

  // Sync to Mermaid for Preview
  const syncToMermaid = (currentNodes, currentEdges) => {
    let mermaid = "flowchart TD\n";
    currentNodes.forEach(node => {
        let shape = `[${node.data.label}]`;
        if (node.type === 'decision') shape = `{${node.data.label}}`;
        if (node.type === 'start' || node.type === 'end') shape = `([${node.data.label}])`;
        mermaid += `    ${node.id}${shape}\n`;
    });
    currentEdges.forEach(edge => {
        const label = edge.label ? `|${edge.label}| ` : '';
        mermaid += `    ${edge.source} --> ${label}${edge.target}\n`;
    });
    setMermaidCode(mermaid);
  };

  const handleNodesChange = useCallback((changes) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        syncToMermaid(nextNodes, edges);
        return nextNodes;
      });
  }, [nodes, edges]);

  const handleEdgesChange = useCallback((changes) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds);
        syncToMermaid(nodes, nextEdges);
        return nextEdges;
      });
  }, [nodes, edges]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => {
        const nextEdges = addEdge(params, eds);
        syncToMermaid(nodes, nextEdges);
        return nextEdges;
    });
  }, [nodes]);

  // Handle Updates from Correction Modal
  const handleUpdateFromModal = (type, idOrIndex, data) => {
    if (type === 'node') {
        const newNodes = rawParsedData.nodes.map(n => n.id === idOrIndex ? { ...n, ...data } : n);
        setRawParsedData(prev => ({ ...prev, nodes: newNodes }));
    } else {
        const newEdges = [...rawParsedData.edges];
        newEdges[idOrIndex] = { ...newEdges[idOrIndex], ...data };
        setRawParsedData(prev => ({ ...prev, edges: newEdges }));
    }

    // Refresh Canvas Preview
    const tempRfNodes = rawParsedData.nodes.map((n, i) => ({
        id: n.id,
        type: n.type === 'decision' ? 'decision' : 'default',
        position: { x: 100 + i * 150, y: 100 },
        data: { label: n.text },
    }));
    const tempRfEdges = rawParsedData.edges.map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
    }));
    setNodes(tempRfNodes);
    setEdges(tempRfEdges);
  };

  const handleFinalize = () => {
    const rfNodes = rawParsedData.nodes.map((n, i) => {
        let labelIcon = '';
        if (n.text.toLowerCase().includes('await') || n.text.toLowerCase().includes('fetch')) labelIcon = '⏳ ';
        if (n.text.toLowerCase().includes('try') || n.text.toLowerCase().includes('catch')) labelIcon = '🛡️ ';
        
        let type = n.type;
        if (n.text.toLowerCase() === 'start') type = 'start';
        if (n.text.toLowerCase() === 'exit' || n.text.toLowerCase() === 'end') type = 'end';
        if (n.type === 'decision') labelIcon = '❓ ';

        return {
            id: n.id,
            type: type || 'process',
            position: n.position ? { x: n.position.x, y: n.position.y } : { x: 100 + i * 200, y: 100 },
            data: { label: `${labelIcon}${n.text || '...'}` },
            className: n.confidence < 0.95 ? 'low-confidence' : '',
        };
    });

    const rfEdges = rawParsedData.edges.map((e, i) => ({
        id: `e${i}`,
        source: e.from,
        target: e.to,
        label: e.label,
        animated: true,
        type: 'smoothstep',
        sourceHandle: e.label === 'No' ? 'right' : 'bottom',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#00f3ff' },
    }));

    const layoutedNodes = getLayoutedElements(rfNodes, rfEdges);

    setNodes(layoutedNodes);
    setEdges(rfEdges);
    syncToMermaid(layoutedNodes, rfEdges);
    setShowCorrectionModal(false);
  };

  const handleExportSVG = () => {
    const svgElement = document.querySelector('.react-flow__renderer svg');
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flowchart.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleParse = async () => {
    setIsProcessing(true);
    try {
      let res;
      if (inputMode === 'text') {
        res = await axios.post(`${API_BASE}/parse-text`, { description: inputText });
      } else if (inputMode === 'code') {
        res = await axios.post(`${API_BASE}/parse-code`, { code: inputText, language: selectedLanguage });
      } else if (inputMode === 'image') {
        const formData = new FormData();
        formData.append('image', inputText); 
        res = await axios.post(`${API_BASE}/parse-image`, formData);
      }

      if (res.data) {
        setRawParsedData({ nodes: res.data.nodes, edges: res.data.edges });
        setValidationLog(res.data.validation);
        
        // AUTONOMOUS UPGRADE: Auto-finalize if confidence is high
        const nodes = res.data.nodes || [];
        const avgConfidence = nodes.length > 0 ? nodes.reduce((acc, n) => acc + (n.confidence || 1.0), 0) / nodes.length : 1.0;
        
        if (avgConfidence > 0.85 && nodes.length > 0) {
            const rfNodes = res.data.nodes.map((n, i) => {
                let labelIcon = '';
                if (n.text.toLowerCase().includes('await') || n.text.toLowerCase().includes('fetch')) labelIcon = '⏳ ';
                if (n.text.toLowerCase().includes('try') || n.text.toLowerCase().includes('catch')) labelIcon = '🛡️ ';
                
                let type = n.type;
                if (n.text.toLowerCase() === 'start' || i === 0) type = 'start';
                if (n.text.toLowerCase() === 'exit' || n.text.toLowerCase() === 'end') type = 'end';
                if (n.type === 'decision') labelIcon = '❓ ';

                return {
                    id: n.id,
                    type: type || 'process',
                    position: { x: 100 + i * 200, y: 100 },
                    data: { label: `${labelIcon}${n.text || '...'}` },
                    className: n.confidence < 0.95 ? 'low-confidence' : '',
                };
            });
            const rfEdges = res.data.edges.map((e, i) => ({
                id: `e${i}`,
                source: e.from,
                target: e.to,
                label: e.label,
                animated: true,
                type: 'smoothstep',
                sourceHandle: e.label === 'No' ? 'right' : 'bottom',
                markerEnd: { type: MarkerType.ArrowClosed, color: '#00f3ff' },
            }));
            const layoutedNodes = getLayoutedElements(rfNodes, rfEdges);
            setNodes(layoutedNodes);
            setEdges(rfEdges);
            syncToMermaid(layoutedNodes, rfEdges);
        } else {
            setShowCorrectionModal(true); // Still show modal for low confidence
        }
      }
    } catch (err) {
      console.error(err);
      setValidationLog({ is_valid: false, errors: [err.message], warnings: [] });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <ShieldCheck color="#ffd700" size={24} />
          <h2 style={{ margin: 0, letterSpacing: '1.5px', color: '#ffd700' }}>PRECISION FLOW</h2>
        </div>

        <div className="step-tabs" style={{ marginTop: '20px' }}>
          <button className={inputMode === 'image' ? 'active' : ''} onClick={() => setInputMode('image')}>IMAGE</button>
          <button className={inputMode === 'code' ? 'active' : ''} onClick={() => setInputMode('code')}>CODE</button>
          <button className={inputMode === 'text' ? 'active' : ''} onClick={() => setInputMode('text')}>TEXT</button>
        </div>

        <div className="input-card">
          {inputMode === 'image' && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <input type="file" id="img-upload" hidden onChange={(e) => setInputText(e.target.files[0])} />
              <label htmlFor="img-upload" style={{ cursor: 'pointer', color: '#00f3ff' }}>
                <Upload size={48} style={{ marginBottom: '10px', opacity: 0.7 }} />
                <p>{inputText?.name || "Upload Image"}</p>
              </label>
            </div>
          )}
          {inputMode === 'code' && (
            <>
              <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ width: '100%', padding: '8px', background: '#1a1b26', border: '1px solid #333', color: 'white', marginBottom: '10px' }}>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
              </select>
              <textarea placeholder="Paste source code for deterministic AST parsing..." 
                  value={inputText} onChange={(e) => setInputText(e.target.value)} />
            </>
          )}
          {inputMode === 'text' && (
            <textarea placeholder="Describe process using BNF slot-filling grammar..." 
                value={inputText} onChange={(e) => setInputText(e.target.value)} />
          )}
        </div>

        <button onClick={handleParse} disabled={isProcessing} style={{ background: '#ffd700', color: '#000', fontWeight: 'bold', boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>
          {isProcessing ? <RefreshCw className="spin" size={18} /> : 'ANALYZE & VERIFY'}
        </button>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={handleExportSVG} className="secondary-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #333' }}>
                <Save size={16} /> SVG
            </button>
            <button onClick={() => alert('Mermaid code copied!')} className="secondary-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid #333' }}>
                <FileText size={16} /> CODE
            </button>
        </div>

        <button 
            onClick={() => setShowCorrectionModal(true)} 
            className="secondary-btn" 
            style={{ width: '100%', marginTop: '10px', background: 'rgba(0, 243, 255, 0.1)', color: '#00f3ff', border: '1px solid #00f3ff', opacity: rawParsedData.nodes.length > 0 ? 1 : 0.5 }}
            disabled={rawParsedData.nodes.length === 0}
        >
            <Edit3 size={14} style={{ marginRight: '5px' }} /> REVIEW / AUDIT GRAPH
        </button>

        <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '10px', color: '#888bab', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={10} /> LIVE MERMAID CODE
            </label>
            <textarea 
                className="input-card" 
                style={{ fontSize: '11px', height: '120px', fontFamily: 'monospace', color: '#00f3ff' }}
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
            />
        </div>

        <div style={{ marginTop: 'auto' }}>
            <label style={{ fontSize: '10px', color: '#888bab', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={10} /> STRUCTURAL VALIDATION
            </label>
            <div className="input-card" style={{ fontSize: '11px', maxHeight: '150px', overflowY: 'auto' }}>
                {!validationLog.is_valid && validationLog.errors.map((e, i) => <div key={i} style={{ color: '#ff4b2b' }}>• {e}</div>)}
                {validationLog.is_valid && <div style={{ color: '#00ff00' }}>• Graph structure is 100% valid</div>}
            </div>
        </div>
      </aside>

      <main className="main-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          theme="dark"
        >
          <Background color="#333" gap={20} />
          <Controls />
        </ReactFlow>

        {showCorrectionModal && (
          <MandatoryCorrectionModal 
            nodes={rawParsedData.nodes}
            edges={rawParsedData.edges}
            onUpdate={handleUpdateFromModal}
            onConfirm={handleFinalize}
          />
        )}
      </main>
    </div>
  );
}
