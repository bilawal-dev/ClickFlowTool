import { Handle, Position } from '@xyflow/react';

// Handle styling factory
function getHandleStyle(showHandles, isSource = false) {
    return {
        width: 12,
        height: 12,
        backgroundColor: isSource ? '#4caf50' : '#2196f3',
        border: '2px solid #fff',
        borderRadius: '50%',
        opacity: showHandles ? 1 : 0,
        transition: 'opacity 0.3s ease'
    }
};

// Universal Node Component with configurable handle positions
export default function UniversalNode({ data, style }) {
    const showHandles = data.showHandles ?? true;
    const enabledHandles = data.enabledHandles || {
        top: true,
        right: true,
        bottom: true,
        left: true
    };

    return (
        <div style={style}>
            {/* Target Handles (Inputs) - Blue */}
            {enabledHandles.top && <Handle type="target" position={Position.Top} id="top-target" style={getHandleStyle(showHandles, false)} />}
            {enabledHandles.bottom && <Handle type="target" position={Position.Bottom} id="bottom-target" style={getHandleStyle(showHandles, false)} />}
            {enabledHandles.left && <Handle type="target" position={Position.Left} id="left-target" style={getHandleStyle(showHandles, false)} />}
            {enabledHandles.right && <Handle type="target" position={Position.Right} id="right-target" style={getHandleStyle(showHandles, false)} />}

            {/* Node Content */}
            {data.label}

            {/* Source Handles (Outputs) - Green */}
            {enabledHandles.top && <Handle type="source" position={Position.Top} id="top-source" style={getHandleStyle(showHandles, true)} />}
            {enabledHandles.bottom && <Handle type="source" position={Position.Bottom} id="bottom-source" style={getHandleStyle(showHandles, true)} />}
            {enabledHandles.left && <Handle type="source" position={Position.Left} id="left-source" style={getHandleStyle(showHandles, true)} />}
            {enabledHandles.right && <Handle type="source" position={Position.Right} id="right-source" style={getHandleStyle(showHandles, true)} />}
        </div>
    );
};