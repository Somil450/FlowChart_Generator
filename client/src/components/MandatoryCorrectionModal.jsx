import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ShieldCheck, Edit3 } from 'lucide-react';

export default function MandatoryCorrectionModal({ nodes, edges, onConfirm, onUpdate }) {
  const [reviewedNodes, setReviewedNodes] = useState(new Set());
  const [reviewedEdges, setReviewedEdges] = useState(new Set());
  const [activeStep, setActiveStep] = useState('nodes'); // 'nodes' | 'edges'

  const allReviewed = 
    reviewedNodes.size === nodes.length && 
    reviewedEdges.size === edges.length;

  const toggleReviewNode = (id) => {
    const next = new Set(reviewedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReviewedNodes(next);
  };

  const toggleReviewEdge = (id) => {
    const next = new Set(reviewedEdges);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReviewedEdges(next);
  };

  const handleSelectAll = () => {
    if (activeStep === 'nodes') {
        const allIds = new Set(nodes.map(n => n.id));
        setReviewedNodes(allIds);
    } else {
        const allIds = new Set(edges.map((e, i) => `e-${i}`));
        setReviewedEdges(allIds);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="correction-modal">
        <div className="modal-header">
          <ShieldCheck color="#ffd700" size={32} />
          <h2>MANDATORY ACCURACY REVIEW</h2>
        </div>
        
        <p className="modal-sub">Confirm every element to ensure 100% accuracy. Detections with confidence &lt; 95% are highlighted.</p>

        <div className="step-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={activeStep === 'nodes' ? 'active' : ''} onClick={() => setActiveStep('nodes')}>
                NODES ({reviewedNodes.size}/{nodes.length})
            </button>
            <button className={activeStep === 'edges' ? 'active' : ''} onClick={() => setActiveStep('edges')}>
                EDGES ({reviewedEdges.size}/{edges.length})
            </button>
          </div>
          <button 
            onClick={handleSelectAll} 
            className="secondary-btn" 
            style={{ width: 'auto', background: 'rgba(255,215,0,0.1)', color: '#ffd700', fontSize: '10px', border: '1px solid #ffd700' }}
          >
            SELECT ALL {activeStep.toUpperCase()}
          </button>
        </div>

        <div className="review-list">
          {activeStep === 'nodes' ? nodes.map(node => (
            <div key={node.id} className={`review-item ${reviewedNodes.has(node.id) ? 'confirmed' : ''} ${node.confidence < 0.95 ? 'low-conf' : ''}`}>
              <div className="item-info">
                  <span className="badge">{node.type}</span>
                  <input 
                    value={node.text} 
                    onChange={(e) => onUpdate('node', node.id, { text: e.target.value })}
                    style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: 'white' }}
                  />
              </div>
              <button 
                className={`confirm-btn ${reviewedNodes.has(node.id) ? 'done' : ''}`}
                onClick={() => toggleReviewNode(node.id)}
              >
                {reviewedNodes.has(node.id) ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              </button>
            </div>
          )) : edges.map((edge, i) => {
            const edgeId = `e-${i}`;
            return (
                <div key={edgeId} className={`review-item ${reviewedEdges.has(edgeId) ? 'confirmed' : ''}`}>
                  <div className="item-info">
                      <span>{edge.from} → {edge.to}</span>
                      <input 
                        placeholder="Label"
                        value={edge.label || ""} 
                        onChange={(e) => onUpdate('edge', i, { label: e.target.value })}
                        style={{ width: '80px', padding: '2px', background: '#0a0b10' }}
                      />
                  </div>
                  <button 
                    className={`confirm-btn ${reviewedEdges.has(edgeId) ? 'done' : ''}`}
                    onClick={() => toggleReviewEdge(edgeId)}
                  >
                    {reviewedEdges.has(edgeId) ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  </button>
                </div>
            )
          })}
        </div>

        <div className="modal-footer">
          <button 
            className="finalize-btn" 
            disabled={!allReviewed}
            onClick={onConfirm}
          >
            CONFIRM & EXPORT
          </button>
        </div>
      </div>
    </div>
  );
}
