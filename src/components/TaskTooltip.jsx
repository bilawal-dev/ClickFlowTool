import React from 'react';

// 🏷️ Tooltip component for task hover details
const TaskTooltip = ({ tooltipData, position, visible }) => {
  if (!visible || !tooltipData) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not set';
    return new Date(parseInt(timestamp)).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (percentComplete) => {
    if (percentComplete === 100) return '#4caf50';
    if (percentComplete > 0) return '#ff9800';
    return '#9c27b0';
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'normal': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-64 max-w-80"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        pointerEvents: 'none'
      }}
    >
      <div className="font-semibold text-gray-800 mb-2">#{tooltipData.id}</div>
      <div className="text-sm text-gray-700 mb-2 font-medium">{tooltipData.name}</div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Progress:</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(tooltipData.percentComplete) }}
            />
            <span className="font-medium">{tooltipData.percentComplete}%</span>
          </div>
        </div>
        
        {tooltipData.timeEstimateDays && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Duration:</span>
            <span>⏱️ {tooltipData.timeEstimateDays} day{tooltipData.timeEstimateDays > 1 ? 's' : ''}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Due Date:</span>
          <span>📅 {formatDate(tooltipData.dueDate)}</span>
        </div>
        
        {tooltipData.startDate && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Start Date:</span>
            <span>📅 {formatDate(tooltipData.startDate)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Priority:</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getPriorityColor(tooltipData.priority) }}
            />
            <span className="font-medium">{tooltipData.priority}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Status:</span>
          <span className="font-medium">{tooltipData.status}</span>
        </div>
        
        {tooltipData.assignees && tooltipData.assignees.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Assignees:</span>
            <span className="font-medium">{tooltipData.assignees.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTooltip; 