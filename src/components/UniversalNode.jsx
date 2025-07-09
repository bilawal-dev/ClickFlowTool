import { Handle, Position } from '@xyflow/react';

// Handle styling factory - now returns Tailwind classes
function getHandleClasses(showHandles, isSource = false) {
    const baseClasses = "w-3 h-3 border-2 border-red-500 rounded-full transition-opacity duration-300 ease-in-out";
    const colorClass = isSource ? "bg-green-500" : "bg-blue-500";
    const opacityClass = showHandles ? "opacity-100" : "opacity-0";

    return `${baseClasses} ${colorClass} ${opacityClass}`;
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
            {enabledHandles.top && <Handle type="target" position={Position.Top} id="top-target" className={getHandleClasses(showHandles, false)} />}
            {enabledHandles.bottom && <Handle type="target" position={Position.Bottom} id="bottom-target" className={getHandleClasses(showHandles, false)} />}
            {enabledHandles.left && <Handle type="target" position={Position.Left} id="left-target" className={getHandleClasses(showHandles, false)} />}
            {enabledHandles.right && <Handle type="target" position={Position.Right} id="right-target" className={getHandleClasses(showHandles, false)} />}

            {/* Node Content */}
            {data.label}

            {/* Source Handles (Outputs) - Green */}
            {enabledHandles.top && <Handle type="source" position={Position.Top} id="top-source" className={getHandleClasses(showHandles, true)} />}
            {enabledHandles.bottom && <Handle type="source" position={Position.Bottom} id="bottom-source" className={getHandleClasses(showHandles, true)} />}
            {enabledHandles.left && <Handle type="source" position={Position.Left} id="left-source" className={getHandleClasses(showHandles, true)} />}
            {enabledHandles.right && <Handle type="source" position={Position.Right} id="right-source" className={getHandleClasses(showHandles, true)} />}
        </div>
    );
};