import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const StartNode = ({ data }) => (
  <div className="custom-node start-node">
    <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
    <div className="node-content">
      <div className="node-label">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const EndNode = ({ data }) => (
  <div className="custom-node end-node">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-label">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
  </div>
);

const ProcessNode = ({ data }) => (
  <div className="custom-node process-node">
    <Handle type="target" position={Position.Top} />
    <div className="node-content">
      <div className="node-label">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const DecisionNode = ({ data }) => (
  <div className="custom-node decision-node">
    <Handle type="target" position={Position.Top} />
    <div className="node-diamond">
      <svg width="150" height="80" viewBox="0 0 150 80">
        <path d="M 75 0 L 150 40 L 75 80 L 0 40 Z" fill="rgba(255, 0, 243, 0.1)" stroke="#ff00f3" strokeWidth="2" />
      </svg>
      <div className="node-label diamond-label">{data.label}</div>
    </div>
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="source" position={Position.Right} id="right" style={{ top: '50%' }} />
  </div>
);

export default {
  start: memo(StartNode),
  end: memo(EndNode),
  process: memo(ProcessNode),
  decision: memo(DecisionNode),
};
