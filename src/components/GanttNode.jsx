import React from 'react';
import { Handle, Position } from '@xyflow/react';
import GanttChart from './GanttChart';

const GanttNode = ({ data }) => {
  const { phaseData, tasks, phaseColor } = data;

  return (
    <div className="gantt-node bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden" 
         style={{ width: '1000px', minHeight: '400px' }}>
      
      {/* Target Handles - Allow connections into the Gantt chart */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="gantt-top-target" 
        className="w-3 h-3 border-2 border-blue-500 bg-blue-500 rounded-full opacity-75 hover:opacity-100" 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="gantt-left-target" 
        className="w-3 h-3 border-2 border-blue-500 bg-blue-500 rounded-full opacity-75 hover:opacity-100" 
      />
      
      {/* Gantt Chart Content */}
      <div className="gantt-content">
        <GanttChart 
          tasks={tasks}
          phaseData={phaseData}
          phaseColor={phaseColor}
        />
      </div>
      
      {/* Source Handles - Allow connections out of the Gantt chart */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="gantt-bottom-source" 
        className="w-3 h-3 border-2 border-green-500 bg-green-500 rounded-full opacity-75 hover:opacity-100" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="gantt-right-source" 
        className="w-3 h-3 border-2 border-green-500 bg-green-500 rounded-full opacity-75 hover:opacity-100" 
      />
    </div>
  );
};

export default GanttNode; 