import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { Settings, Hand, RotateCcw, CheckCircle, XCircle, FolderOpen, Folder, Save, Link, TestTube, X, MapPin, Edit, Check, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Loader2, AlertTriangle, RefreshCw, Layers, LayoutGrid, ChevronDown, Zap, HelpCircle, MousePointer, Move, Trash2, Square, Calendar, User, Search, Menu, Home, BarChart3, FileText, Briefcase } from 'lucide-react';
import UniversalNode from './UniversalNode';
import HeaderNode from './HeaderNode';
import LegendPanel from './LegendPanel';
import { clickupApi } from '../services/clickupApi';
import { Background, BackgroundVariant, Controls } from '@xyflow/react';
import CalendarBackground from './CalenderBackground';
// 📅 Import timeline positioning utilities
import {
  calculatePhasePosition,
  calculateTaskPosition,
  groupTasksByColumn,
  calculateTimelineWidth
} from './TimelinePositioning';


// Node type mapping for ReactFlow - ALL use Universal node with full handle support
const nodeTypes = {
  horizontalFlow: UniversalNode,
  decision: UniversalNode,
  milestone: UniversalNode,
  task: UniversalNode,
  levelDrop: UniversalNode,
  header: HeaderNode,  // Headers don't need handles
};

export default function FlowChart() {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showHandles, setShowHandles] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [nodeHandleConfigs, setNodeHandleConfigs] = useState({});
  const [nodeLabels, setNodeLabels] = useState({});
  const [editingText, setEditingText] = useState('');
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [clickupData, setClickupData] = useState(null);
  const [isLoadingClickupData, setIsLoadingClickupData] = useState(true);
  const [calendarOpacity, setCalendarOpacity] = useState(0.5);
  const [activeHeaderDropdown, setActiveHeaderDropdown] = useState(null);

  // Project management states
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track full initialization
  const [searchTerm, setSearchTerm] = useState(''); // Search functionality
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // Track expanded folders

  // 📅 Timeline header positioning - track ReactFlow viewport
  const [currentViewport, setCurrentViewport] = useState({ x: 10, y: 250, zoom: 0.75 });

  const reactFlowInstance = useReactFlow();

  // Generate project-specific localStorage keys
  const getStorageKey = useCallback((baseKey) => {
    if (selectedProject) {
      return `${baseKey}-project-${selectedProject.id}`;
    }
    return baseKey; // Use global key for template mode
  }, [selectedProject]);

  // Load saved viewport from localStorage
  const loadSavedViewport = () => {
    try {
      const key = getStorageKey('flowchart-viewport');
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading viewport:', error);
    }
    return { x: 10, y: 250, zoom: 0.75 };
  };

  // Load saved node positions from localStorage
  const loadSavedNodePositions = () => {
    try {
      const key = getStorageKey('flowchart-node-positions');
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading node positions:', error);
    }
    return {};
  };

  // Save viewport to localStorage
  const saveViewport = useCallback((viewport) => {
    try {
      const key = getStorageKey('flowchart-viewport');
      localStorage.setItem(key, JSON.stringify(viewport));
    } catch (error) {
      console.error('Error saving viewport:', error);
    }
  }, [getStorageKey]);

  // Save node positions to localStorage
  const saveNodePositions = useCallback((nodes) => {
    try {
      const positions = {};
      nodes.forEach(node => {
        positions[node.id] = node.position;
      });
      const key = getStorageKey('flowchart-node-positions');
      localStorage.setItem(key, JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving node positions:', error);
    }
  }, [getStorageKey]);

  // Load saved handle configurations from localStorage
  const loadSavedHandleConfigs = () => {
    try {
      const key = getStorageKey('flowchart-handle-configs');
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNodeHandleConfigs(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading handle configs:', error);
    }
    return {};
  };

  // Save handle configurations to localStorage
  const saveHandleConfigs = useCallback((configs) => {
    try {
      const key = getStorageKey('flowchart-handle-configs');
      localStorage.setItem(key, JSON.stringify(configs));
      setNodeHandleConfigs(configs);
    } catch (error) {
      console.error('Error saving handle configs:', error);
    }
  }, [getStorageKey]);

  // Clean, simple node styles
  const nodeStyles = {
    automation: {
      background: '#e3f2fd',
      border: '2px solid #1976d2',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#0d47a1',
      minWidth: '160px',
      textAlign: 'center'
    },
    decision: {
      background: '#fff3e0',
      border: '2px dashed #f57c00',
      borderRadius: '8px',
      padding: '16px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#ef6c00',
      minWidth: '160px',
      textAlign: 'center'
    },
    milestone: {
      background: '#e8f5e8',
      border: '3px solid #4caf50',
      borderRadius: '12px',
      padding: '20px',
      fontSize: '15px',
      fontWeight: '700',
      color: '#2e7d32',
      minWidth: '180px',
      textAlign: 'center',
      cursor: 'pointer',
      // NEW STYLING HERE FOR EQUIDISTANT SPACING
      maxWidth: '300px',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    },
    task: {
      background: '#f3e5f5',
      border: '2px solid #9c27b0',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#6a1b9a',
      minWidth: '140px',
      textAlign: 'center'
    },
    levelHeader: {
      background: '#f5f5f5',
      border: '2px solid #757575',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#424242',
      minWidth: '250px',
      textAlign: 'center'
    }
  };

  // Get node with saved position or default position
  const createNode = (defaultNode, savedPositions, showHandles, handleConfigs, savedLabels) => {
    const savedPosition = savedPositions[defaultNode.id];
    const savedHandleConfig = handleConfigs[defaultNode.id] || {
      top: true,
      right: true,
      bottom: true,
      left: true
    };
    const savedLabel = savedLabels[defaultNode.id] || defaultNode.data.label;

    return {
      ...defaultNode,
      position: savedPosition || defaultNode.position,
      draggable: true, // Make all nodes draggable
      data: {
        ...defaultNode.data,
        label: savedLabel,
        showHandles: showHandles,
        enabledHandles: savedHandleConfig
      }
    };
  };

  // Load default positions (either saved custom defaults or hardcoded) - MOVED BEFORE getDefaultNodes
  const loadDefaultPositions = () => {
    try {
      const saved = localStorage.getItem('flowchart-default-positions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading default positions:', error);
    }
    return {}; // Return empty object to use hardcoded positions
  };

  // 📅 Generate timeline columns for positioning (shared between calendar and nodes)
  const generateTimelineColumns = (timeline) => {
    if (!timeline || !timeline.startDate || !timeline.endDate) {
      return [];
    }

    const { startDate, endDate, timelineType } = timeline;
    const columns = [];

    switch (timelineType) {
      case 'daily':
        let currentDate = new Date(startDate);
        let columnIndex = 0;

        // Start from Monday of the start week
        const dayOfWeek = currentDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        currentDate.setDate(currentDate.getDate() + daysToMonday);

        while (currentDate <= endDate) {
          // Only include Monday through Friday
          if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
            columns.push({
              date: new Date(currentDate),
              dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
              dayNumber: currentDate.getDate(),
              month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
              columnIndex: columnIndex++,
              type: 'day',
              width: 120
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;

      case 'weekly':
        let weekDate = new Date(startDate);
        let weekColumnIndex = 0;

        // Start from Monday of the start week
        const weekDayOfWeek = weekDate.getDay();
        const weekDaysToMonday = weekDayOfWeek === 0 ? -6 : 1 - weekDayOfWeek;
        weekDate.setDate(weekDate.getDate() + weekDaysToMonday);

        while (weekDate <= endDate) {
          const weekEnd = new Date(weekDate);
          weekEnd.setDate(weekDate.getDate() + 4); // Friday

          columns.push({
            date: new Date(weekDate),
            dayName: 'Week',
            dayNumber: `${weekDate.getDate()}-${weekEnd.getDate()}`,
            month: weekDate.toLocaleDateString('en-US', { month: 'short' }),
            columnIndex: weekColumnIndex++,
            type: 'week',
            width: 160,
            endDate: weekEnd
          });

          weekDate.setDate(weekDate.getDate() + 7); // Next Monday
        }
        break;

      case 'monthly':
        let monthDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        let monthColumnIndex = 0;

        while (monthDate <= endDate) {
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

          columns.push({
            date: new Date(monthDate),
            dayName: 'Month',
            dayNumber: monthDate.toLocaleDateString('en-US', { month: 'short' }),
            month: monthDate.getFullYear().toString(),
            columnIndex: monthColumnIndex++,
            type: 'month',
            width: 200,
            endDate: monthEnd
          });

          monthDate.setMonth(monthDate.getMonth() + 1);
        }
        break;
    }

    return columns;
  };

  // 📅 Memoize timeline columns to avoid regeneration on every render
  const timelineColumns = React.useMemo(() => {
    return generateTimelineColumns(clickupData?.timeline);
  }, [clickupData?.timeline]);

  // 📅 Calculate total timeline width
  const timelineWidth = React.useMemo(() => {
    return calculateTimelineWidth(timelineColumns);
  }, [timelineColumns]);

  // Default node positions - now using real ClickUp data when available
  const getDefaultNodes = () => {
    const savedPositions = loadSavedNodePositions();
    const customDefaults = loadDefaultPositions();
    const handleConfigs = nodeHandleConfigs;
    const savedLabels = nodeLabels;

    // Level headers with better spacing - use custom defaults if available
    const levelHeaders = [
      { id: 'level1-header', type: 'header', position: customDefaults['level1-header'] || { x: 50, y: 20 }, data: { label: '🔄 LEVEL 1: CRM LOGIC FLOW' }, style: nodeStyles.levelHeader },
      { id: 'level2-header', type: 'header', position: customDefaults['level2-header'] || { x: 10, y: 310 }, data: { label: '🎯 LEVEL 2: PROJECT PHASES (ClickUp)' }, style: nodeStyles.levelHeader },
      { id: 'level3-header', type: 'header', position: customDefaults['level3-header'] || { x: 50, y: 680 }, data: { label: '📋 LEVEL 3: PHASE TASKS (ClickUp)' }, style: nodeStyles.levelHeader }
    ];

    // LEVEL 1: CRM Logic Flow - Keep exactly the same
    const level1Nodes = [
      { id: 'crm-closed-won', type: 'horizontalFlow', position: customDefaults['crm-closed-won'] || { x: 150, y: 100 }, data: { label: '🎉 CRM\nClosed Won' }, style: nodeStyles.automation },
      { id: 'sent-to-corey', type: 'horizontalFlow', position: customDefaults['sent-to-corey'] || { x: 380, y: 100 }, data: { label: '👤 Assigned to\nCorey' }, style: nodeStyles.decision },
      { id: 'pm-known-check', type: 'decision', position: customDefaults['pm-known-check'] || { x: 610, y: 100 }, data: { label: '❓ Project Manager\nKnown?' }, style: nodeStyles.decision },
      { id: 'click-up-folder', type: 'horizontalFlow', position: customDefaults['click-up-folder'] || { x: 840, y: 60 }, data: { label: '📁 Access Existing\nClickUp Folder' }, style: nodeStyles.automation },
      { id: 'create-folder', type: 'horizontalFlow', position: customDefaults['create-folder'] || { x: 840, y: 140 }, data: { label: '🆕 Create New\nClickUp Folder' }, style: nodeStyles.automation },
      { id: 'merge-back', type: 'horizontalFlow', position: customDefaults['merge-back'] || { x: 1070, y: 100 }, data: { label: '🔄 Merge to\nMain Workflow' }, style: nodeStyles.automation },
      { id: 'template-created', type: 'levelDrop', position: customDefaults['template-created'] || { x: 1300, y: 100 }, data: { label: '📋 Project Template\nCreated' }, style: nodeStyles.automation }
    ];

    // LEVEL 2: Generate phase nodes with timeline-based positioning
    let level2Nodes = [];
    if (clickupData && clickupData.phases) {

      level2Nodes = clickupData.phases.map((phase, index) => {
        const nodeId = `phase-${phase.phase}`;

        // 📅 Use timeline positioning if available, fallback to default
        let position;
        if (customDefaults[nodeId]) {
          // Use saved custom position
          position = customDefaults[nodeId];
        } else if (clickupData.timeline && timelineColumns.length > 0) {
          // Calculate timeline-based position
          const phasePos = calculatePhasePosition(phase, timelineColumns);
          position = { x: phasePos.x, y: 460 };
        } else {
          // Fallback to default spacing
          position = { x: 150 + (index * 300), y: 460 };
        }

        // Create milestone style with phase colors
        const phaseStyle = {
          ...nodeStyles.milestone,
          border: `3px solid ${phase.color}`,
        };

        // 📅 Enhanced phase label with timeline info
        let phaseLabel = `${phase.emoji} Phase ${phase.phase}\n${phase.name}\n(${phase.totalTasks} tasks, ${phase.averageCompletion}%)`;

        if (phase.startDate && phase.endDate) {
          const startStr = phase.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endStr = phase.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          phaseLabel += `\n📅 ${startStr} - ${endStr}`;
        }

        phaseLabel += '\n(Double-click to expand)';

        return {
          id: nodeId,
          type: 'milestone',
          position,
          data: {
            label: phaseLabel,
            phaseData: phase // Store phase data for reference
          },
          style: phaseStyle
        };
      });
    }

    // LEVEL 3: Generate task nodes with timeline-based positioning
    let taskNodes = [];
    if (clickupData && clickupData.phases) {

      // Group all tasks by their timeline columns for proper stacking
      const allTasks = clickupData.phases.flatMap(phase => phase.tasks);
      const groupedTasks = timelineColumns.length > 0 ? groupTasksByColumn(allTasks, timelineColumns) : {};

      clickupData.phases.forEach((phase) => {
        phase.tasks.forEach((task, taskIndex) => {
          const nodeId = `task-${task.id}`;

          // 📅 Use timeline positioning if available
          let position;
          if (customDefaults[nodeId]) {
            // Use saved custom position
            position = customDefaults[nodeId];
          } else if (clickupData.timeline && timelineColumns.length > 0) {
            // Find this task's position within its column for stacking
            const taskDate = task.dueDate || task.startDate;
            let taskIndexInColumn = 0;

            if (taskDate) {
              // Find which tasks are in the same column
              Object.entries(groupedTasks).forEach(([columnIndex, tasksInColumn]) => {
                const taskInColumn = tasksInColumn.findIndex(t => t.id === task.id);
                if (taskInColumn !== -1) {
                  taskIndexInColumn = taskInColumn;
                }
              });
            }

            // Calculate timeline-based position
            const taskPos = calculateTaskPosition(task, timelineColumns, taskIndexInColumn);
            position = taskPos;
          } else {
            // Fallback to default positioning
            const baseX = 120 + (phase.phase * 230);
            const xPosition = baseX + (taskIndex % 2) * 90;
            const yPosition = 760 + Math.floor(taskIndex / 2) * 80;
            position = { x: xPosition, y: yPosition };
          }

          // Create task style with status-based coloring
          const completionColor = task.percentComplete === 100 ? '#4caf50' :
            task.percentComplete > 0 ? '#ff9800' : '#9c27b0';

          const taskStyle = {
            ...nodeStyles.task,
            border: `2px solid ${completionColor}`,
            background: task.percentComplete === 100 ? '#e8f5e8' :
              task.percentComplete > 0 ? '#fff3e0' : '#f3e5f5'
          };

          // 📅 Enhanced task label with timeline info
          let taskLabel = `${task.name}\n(${task.percentComplete}% complete)`;

          if (task.dueDate) {
            const dueStr = new Date(parseInt(task.dueDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            taskLabel += `\n📅 Due: ${dueStr}`;
          } else if (task.startDate) {
            const startStr = new Date(parseInt(task.startDate)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            taskLabel += `\n📅 Start: ${startStr}`;
          }

          taskNodes.push({
            id: nodeId,
            type: 'task',
            position,
            data: {
              label: taskLabel,
              taskData: task, // Store task data for reference
              parentPhase: phase.phase
            },
            style: taskStyle
          });
        });
      });
    }

    return {
      levelHeaders: levelHeaders.map(node => createNode(node, savedPositions, showHandles, handleConfigs, savedLabels)),
      level1Nodes: level1Nodes.map(node => createNode(node, savedPositions, showHandles, handleConfigs, savedLabels)),
      level2Nodes: level2Nodes.map(node => createNode(node, savedPositions, showHandles, handleConfigs, savedLabels)),
      taskNodes: taskNodes.map(node => createNode(node, savedPositions, showHandles, handleConfigs, savedLabels))
    };
  };

  // Clean edge styling with updated handle connections
  const level1Edges = [
    { id: 'l1-e1', source: 'crm-closed-won', target: 'sent-to-corey', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'default', animated: true, style: { strokeWidth: 2, stroke: '#1976d2' } },
    { id: 'l1-e2', source: 'sent-to-corey', target: 'pm-known-check', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'default', animated: true, style: { strokeWidth: 2, stroke: '#1976d2' } },
    { id: 'l1-e3', source: 'pm-known-check', target: 'click-up-folder', sourceHandle: 'top-source', targetHandle: 'left-target', label: '✅ Known', type: 'default', style: { strokeWidth: 2, stroke: '#4caf50' } },
    { id: 'l1-e4', source: 'pm-known-check', target: 'create-folder', sourceHandle: 'bottom-source', targetHandle: 'left-target', label: '❌ Unknown', type: 'default', style: { strokeWidth: 2, stroke: '#f44336' } },
    { id: 'l1-e5', source: 'click-up-folder', target: 'merge-back', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'default', style: { strokeWidth: 2, stroke: '#1976d2' } },
    { id: 'l1-e6', source: 'create-folder', target: 'merge-back', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'default', style: { strokeWidth: 2, stroke: '#1976d2' } },
    { id: 'l1-e7', source: 'merge-back', target: 'template-created', sourceHandle: 'right-source', targetHandle: 'left-target', type: 'default', animated: true, style: { strokeWidth: 2, stroke: '#1976d2' } }
  ];

  // Generate dynamic edges based on ClickUp data
  const getDynamicEdges = () => {
    // Level drop - connects from bottom to top
    let levelDropEdges = [];
    let level2Edges = [];
    let taskEdges = [];

    if (clickupData && clickupData.phases && clickupData.phases.length > 0) {
      // Connect to first phase
      const firstPhaseId = `phase-${clickupData.phases[0].phase}`;
      levelDropEdges = [
        { id: 'drop-1', source: 'template-created', target: firstPhaseId, sourceHandle: 'bottom-source', targetHandle: 'top-target', type: 'default', animated: true, style: { strokeWidth: 3, stroke: '#2e7d32' } }
      ];

      // Generate connections between phases (left to right)
      level2Edges = clickupData.phases.slice(0, -1).map((phase, index) => {
        const sourceId = `phase-${phase.phase}`;
        const targetId = `phase-${clickupData.phases[index + 1].phase}`;
        return {
          id: `l2-e${index + 1}`,
          source: sourceId,
          target: targetId,
          sourceHandle: 'right-source',
          targetHandle: 'left-target',
          type: 'default',
          animated: true,
          style: { strokeWidth: 2, stroke: '#4caf50' }
        };
      });

      // Generate task connections (phase to tasks)
      clickupData.phases.forEach((phase) => {
        const phaseId = `phase-${phase.phase}`;
        phase.tasks.forEach((task, taskIndex) => {
          const taskId = `task-${task.id}`;
          taskEdges.push({
            id: `p${phase.phase}-e${taskIndex + 1}`,
            source: phaseId,
            target: taskId,
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target',
            type: 'default',
            style: { strokeWidth: 1, stroke: phase.color || '#9c27b0' }
          });
        });
      });
    }

    return { levelDropEdges, level2Edges, taskEdges };
  };



  const getVisibleNodes = () => {
    const { levelHeaders, level1Nodes, level2Nodes, taskNodes } = getDefaultNodes();
    const allNodes = [...levelHeaders, ...level1Nodes, ...level2Nodes];

    if (showAllTasks) {
      // Show all tasks when "Expand Tasks" is enabled
      allNodes.push(...taskNodes);
    } else if (expandedMilestones.size > 0) {
      // Show only tasks for expanded milestones
      const expandedTaskNodes = taskNodes.filter(taskNode => {
        // Check if this task belongs to an expanded milestone
        const parentPhase = taskNode.data.parentPhase;
        const parentPhaseId = `phase-${parentPhase}`;
        return expandedMilestones.has(parentPhaseId);
      });
      allNodes.push(...expandedTaskNodes);
    }
    return allNodes;
  };

  const getVisibleEdges = () => {
    // Load saved connection modifications
    const connectionModsKey = getStorageKey('flowchart-connection-mods');
    const savedConnectionMods = JSON.parse(localStorage.getItem(connectionModsKey) || '{}');

    // Get dynamic edges based on ClickUp data
    const { levelDropEdges, level2Edges, taskEdges } = getDynamicEdges();

    // Get base edges and apply modifications
    const baseEdges = [...level1Edges, ...levelDropEdges, ...level2Edges];

    if (showAllTasks) {
      // Show all task edges when "Expand Tasks" is enabled
      baseEdges.push(...taskEdges);
    } else if (expandedMilestones.size > 0) {
      // Show only task edges for expanded milestones
      const expandedTaskEdges = taskEdges.filter(edge => {
        // Check if this edge connects to an expanded milestone
        const sourcePhaseMatch = edge.source.match(/^phase-(\d+)$/);
        if (sourcePhaseMatch) {
          const phaseId = edge.source;
          return expandedMilestones.has(phaseId);
        }
        return false;
      });
      baseEdges.push(...expandedTaskEdges);
    }

    // Apply modifications to base edges
    const modifiedEdges = baseEdges.map(edge => {
      const mod = savedConnectionMods[edge.id];
      if (mod) {
        return { ...edge, ...mod };
      }
      return edge;
    }).filter(edge => !savedConnectionMods[edge.id]?.deleted);

    // Load saved custom connections
    try {
      const customConnectionsKey = getStorageKey('flowchart-custom-connections');
      const savedConnections = localStorage.getItem(customConnectionsKey);
      if (savedConnections) {
        const customConnections = JSON.parse(savedConnections);
        modifiedEdges.push(...customConnections);
      }
    } catch (error) {
      console.error('Error loading custom connections:', error);
    }

    return modifiedEdges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(getVisibleNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getVisibleEdges());

  // Save connection modifications to localStorage
  const saveConnectionMod = useCallback((edgeId, modification) => {
    const key = getStorageKey('flowchart-connection-mods');
    const savedMods = JSON.parse(localStorage.getItem(key) || '{}');
    savedMods[edgeId] = modification;
    localStorage.setItem(key, JSON.stringify(savedMods));
  }, [getStorageKey]);

  // Delete existing connection
  const deleteConnection = useCallback((edgeId) => {
    saveConnectionMod(edgeId, { deleted: true });
    setEdges(getVisibleEdges());
  }, [saveConnectionMod, setEdges]);

  // Handle edge changes and update localStorage for all connections
  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);

    // Handle edge deletions
    const deletedEdges = changes.filter(change => change.type === 'remove');
    if (deletedEdges.length > 0) {
      deletedEdges.forEach(change => {
        const edgeId = change.id;
        if (edgeId.startsWith('custom-')) {
          // Remove from custom connections
          const customConnectionsKey = getStorageKey('flowchart-custom-connections');
          const savedConnections = JSON.parse(localStorage.getItem(customConnectionsKey) || '[]');
          const updatedConnections = savedConnections.filter(edge => edge.id !== edgeId);
          localStorage.setItem(customConnectionsKey, JSON.stringify(updatedConnections));
        } else {
          // Mark pre-existing connection as deleted
          deleteConnection(edgeId);
        }
      });
    }
  }, [onEdgesChange, deleteConnection, getStorageKey]);

  // Load saved viewport on component mount and when project changes
  useEffect(() => {
    const savedViewport = loadSavedViewport();
    // 📅 Update current viewport state for timeline header sync
    setCurrentViewport(savedViewport);
    
    if (reactFlowInstance) {
      setTimeout(() => {
        reactFlowInstance.setViewport(savedViewport);
      }, 100); // Small delay to ensure ReactFlow is ready
    }
  }, [reactFlowInstance, selectedProject]); // Re-run when project changes too

  // Load saved handle configurations on component mount
  useEffect(() => {
    loadSavedHandleConfigs();
  }, []);

  // Save and load node labels
  const saveNodeLabels = (labels) => {
    setNodeLabels(labels);
    const key = getStorageKey('flowchart-node-labels');
    localStorage.setItem(key, JSON.stringify(labels));
  };

  const loadSavedNodeLabels = () => {
    try {
      const key = getStorageKey('flowchart-node-labels');
      const saved = localStorage.getItem(key);
      if (saved) {
        const labels = JSON.parse(saved);
        setNodeLabels(labels);
        return labels;
      }
    } catch (error) {
      console.error('Error loading node labels:', error);
    }
    return {};
  };

  // Load saved node labels on component mount
  useEffect(() => {
    loadSavedNodeLabels();
  }, []);

  // Reload project-specific data when selectedProject changes
  useEffect(() => {
    // Load project-specific data when project changes
    loadSavedHandleConfigs();
    loadSavedNodeLabels();
    // Note: Node positions and viewport will be loaded through the normal flow
    // when getDefaultNodes() and loadSavedViewport() are called with the new project context

    // Update nodes and edges to reflect project-specific data
    setNodes(getVisibleNodes());
    setEdges(getVisibleEdges());
  }, [selectedProject]); // Re-run when selectedProject changes

  // 🔄 Load template data for flowchart structure (only when no project is selected)
  useEffect(() => {
    const loadTemplateData = async () => {
      if (selectedProject) {
        return; // Don't load template if we already have a project
      }

      // Don't set loading during initialization - handled by isInitializing

      try {
        const processedData = await clickupApi.getProcessedTemplateData();
        setClickupData(processedData);

      } catch (error) {
        console.error('❌ Failed to load template data:', error);
        // Keep clickupData as null, will fall back to hardcoded data
      }
      // Don't end loading here - handled by initialization coordination
    };

    // Load template data as fallback only when switching back to no project
    if (selectedProject === null && !isInitializing) {
      loadTemplateData();
    }
  }, [selectedProject, isInitializing]); // Re-run when selectedProject changes to null

  // 🎯 Load real project tasks when location is selected
  useEffect(() => {
    const loadProjectTasks = async () => {
      if (!selectedProject) {
        if (isInitializing) {
          // During initialization, end the process if no project available
          setIsInitializing(false);
        }
        return;
      }


      // Only show loading spinner if not during initialization (user switching projects)
      if (!isInitializing) {
        setIsLoadingClickupData(true);
      }

      try {
        // Get project tasks and merge with template structure
        const projectData = await clickupApi.getProcessedProjectData(selectedProject.id);

        // Keep template structure but use real project task data
        setClickupData(projectData);

      } catch (error) {
        console.error('❌ Failed to load project tasks:', error);
        // Keep existing template data as fallback
      } finally {
        // End initialization if this was the initial load
        if (isInitializing) {
          setIsInitializing(false);
        } else {
          // End loading spinner for project switching
          setIsLoadingClickupData(false);
        }
      }
    };

    // Load project tasks when project selection changes
    loadProjectTasks();
  }, [selectedProject, isInitializing]); // Re-run when selected project changes

  // 🚀 Load franchise locations for dropdown
  useEffect(() => {
    const loadProjects = async () => {
      setIsLoadingProjects(true);

      try {
        const projectsData = await clickupApi.getUserProjects();
        const projects = projectsData.projects || [];
        setProjects(projects);

        // Auto-select first project if available and during initialization
        if (projects.length > 0 && !selectedProject && isInitializing) {
          setSelectedProject(projects[0]);
        } else if (projects.length === 0 && isInitializing) {
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('❌ Failed to load projects:', error);
        setProjects([]);
        // End initialization if projects fail to load
        if (isInitializing) {
          setIsInitializing(false);
        }
      } finally {
        setIsLoadingProjects(false);
      }
    };

    // Load projects on component mount only
    if (isInitializing) {
      loadProjects();
    }
  }, [isInitializing, selectedProject]); // Re-run when initialization state changes

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setShowProjectDropdown(false);
    setActiveHeaderDropdown(null);
    setSearchTerm(''); // Clear search when selecting
  };

  // Toggle folder expansion
  const toggleFolder = (folderName) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  // Filter projects based on search term
  const getFilteredProjects = () => {
    if (!searchTerm.trim()) return projects;

    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customerFolder?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Delete invalid connections when handles are disabled
  const cleanupInvalidConnections = useCallback(() => {
    const currentNodes = reactFlowInstance?.getNodes() || [];
    const currentEdges = reactFlowInstance?.getEdges() || [];

    const validEdges = currentEdges.filter(edge => {
      const sourceNode = currentNodes.find(n => n.id === edge.source);
      const targetNode = currentNodes.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode) return false;

      const sourceHandles = sourceNode.data.enabledHandles || { top: true, right: true, bottom: true, left: true };
      const targetHandles = targetNode.data.enabledHandles || { top: true, right: true, bottom: true, left: true };

      // Check if source handle is enabled
      const sourcePosition = edge.sourceHandle?.replace('-source', '');
      if (sourcePosition && !sourceHandles[sourcePosition]) return false;

      // Check if target handle is enabled
      const targetPosition = edge.targetHandle?.replace('-target', '');
      if (targetPosition && !targetHandles[targetPosition]) return false;

      return true;
    });

    if (validEdges.length !== currentEdges.length) {
      setEdges(validEdges);
    }
  }, [reactFlowInstance, setEdges]);

  // Update nodes when milestones expand/collapse, handles visibility changes, or ClickUp data loads
  React.useEffect(() => {
    setNodes(getVisibleNodes());
    setEdges(getVisibleEdges());
  }, [expandedMilestones, showAllTasks, showHandles, nodeHandleConfigs, nodeLabels, clickupData]);

  // Cleanup invalid connections when handle configs change
  React.useEffect(() => {
    cleanupInvalidConnections();
  }, [nodeHandleConfigs, cleanupInvalidConnections]);

  // Handle node position changes (when dragged)
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);

    // Save positions when nodes are dragged
    const positionChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    if (positionChanges.length > 0) {
      // Get current nodes and save their positions
      setTimeout(() => {
        const currentNodes = reactFlowInstance?.getNodes() || [];
        saveNodePositions(currentNodes);
      }, 100);
    }
  }, [onNodesChange, reactFlowInstance, saveNodePositions]);

  const handleNodeDoubleClick = (event, node) => {

    // Check if it's a phase node (milestone type) or has cursor pointer
    if (node.type === 'milestone' || (node.style && node.style.cursor === 'pointer')) {
      const newExpanded = new Set(expandedMilestones);
      if (newExpanded.has(node.id)) {
        newExpanded.delete(node.id);
      } else {
        newExpanded.add(node.id);
      }
      setExpandedMilestones(newExpanded);
    } else {
    }
  };

  const toggleAllTasks = () => {
    setShowAllTasks(!showAllTasks);
    setExpandedMilestones(new Set());
  };

  // Handle viewport changes and save to localStorage
  const handleViewportChange = useCallback((viewport) => {
    saveViewport(viewport);
    
    // 📅 Update current viewport for timeline header synchronization
    setCurrentViewport(viewport);

    // Check if user is out of main content bounds
    const contentBounds = {
      minX: 0,
      maxX: 1450,
      minY: -50,
      maxY: 950
    };

    // Calculate visible area based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const visibleLeft = -viewport.x / viewport.zoom;
    const visibleRight = visibleLeft + viewportWidth / viewport.zoom;
    const visibleTop = -viewport.y / viewport.zoom;
    const visibleBottom = visibleTop + viewportHeight / viewport.zoom;

    // Check if visible area overlaps with content bounds
    const isVisible = !(
      visibleRight < contentBounds.minX ||
      visibleLeft > contentBounds.maxX ||
      visibleBottom < contentBounds.minY ||
      visibleTop > contentBounds.maxY
    );

    setIsOutOfBounds(!isVisible);
  }, [saveViewport]);

  // Save current layout as new default
  const saveCurrentLayoutAsDefault = () => {
    const currentNodes = reactFlowInstance?.getNodes() || [];
    const defaultPositions = {};

    currentNodes.forEach(node => {
      defaultPositions[node.id] = {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y)
      };
    });

    // Save to a special localStorage key for default positions
    localStorage.setItem('flowchart-default-positions', JSON.stringify(defaultPositions));
    alert('✅ Current layout saved as default! This will be the new reset position.');
  };



  // Reset node positions (functionality moved to header dropdown)

  // Reset to overview
  const resetView = () => {
    const newViewport = { x: 10, y: 250, zoom: 0.75 };

    if (reactFlowInstance) {
      // reactFlowInstance.fitView({ padding: 0.1, maxZoom: 0.75 })

      reactFlowInstance.setViewport(newViewport);
      saveViewport(newViewport);
      // 📅 Update timeline header sync
      setCurrentViewport(newViewport);
    }
  };

  // Focus on specific level
  const focusLevel = (level) => {
    let newViewport;
    switch (level) {
      case 1:
        newViewport = { x: 10, y: 350, zoom: 1.0 };
        break;
      case 2:
        newViewport = { x: 10, y: -150, zoom: 1.0 };
        break;
      case 3:
        newViewport = { x: 10, y: -250, zoom: 1.0 };
        break;
      default:
        newViewport = { x: 10, y: 250, zoom: 0.75 };
    }
    if (reactFlowInstance) {
      reactFlowInstance.setViewport(newViewport);
      saveViewport(newViewport);
      // 📅 Update timeline header sync
      setCurrentViewport(newViewport);
    }
  };

  // Handle right-click context menu
  const handleNodeContextMenu = (event, node) => {
    event.preventDefault();
    if (node.type === 'header') return; // Don't show context menu for headers

    const currentText = node.data.label || '';
    setEditingText(currentText);

    setContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
      currentConfig: node.data.enabledHandles || { top: true, right: true, bottom: true, left: true },
      currentText: currentText
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close dropdown (removed - functionality moved to header)
  const closeDropdown = () => {
    // No-op - functionality moved to header dropdowns
  };

  // Toggle handle for a node
  const toggleNodeHandle = (nodeId, position) => {
    const newConfigs = { ...nodeHandleConfigs };
    if (!newConfigs[nodeId]) {
      newConfigs[nodeId] = { top: true, right: true, bottom: true, left: true };
    }
    newConfigs[nodeId][position] = !newConfigs[nodeId][position];
    saveHandleConfigs(newConfigs);
  };

  // Reset handles for a node
  const resetNodeHandles = (nodeId) => {
    const newConfigs = { ...nodeHandleConfigs };
    newConfigs[nodeId] = { top: true, right: true, bottom: true, left: true };
    saveHandleConfigs(newConfigs);
    closeContextMenu();
  };

  // Update node text
  const updateNodeText = (nodeId, newText) => {
    const newLabels = { ...nodeLabels };
    newLabels[nodeId] = newText;
    saveNodeLabels(newLabels);
  };

  // Save edited text
  const saveEditedText = (nodeId) => {
    if (editingText.trim()) {
      updateNodeText(nodeId, editingText.trim());
    }
    setEditingText('');
    closeContextMenu();
  };

  // Handle new connections when user drags between handles
  const onConnect = useCallback((connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;

    // Check if both handles are enabled
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (!sourceNode || !targetNode) return;

    const sourceHandles = sourceNode.data.enabledHandles || { top: true, right: true, bottom: true, left: true };
    const targetHandles = targetNode.data.enabledHandles || { top: true, right: true, bottom: true, left: true };

    // Check if source handle is enabled
    const sourcePosition = sourceHandle?.replace('-source', '');
    if (sourcePosition && !sourceHandles[sourcePosition]) {
      return;
    }

    // Check if target handle is enabled
    const targetPosition = targetHandle?.replace('-target', '');
    if (targetPosition && !targetHandles[targetPosition]) {
      return;
    }

    // Create new edge with a unique ID
    const newEdge = {
      id: `custom-${Date.now()}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      type: 'default',
      style: { strokeWidth: 2, stroke: '#2196f3' }
    };

    setEdges((edges) => {
      const updatedEdges = [...edges, newEdge];
      // Save custom connections to localStorage
      const customConnections = updatedEdges.filter(edge => edge.id.startsWith('custom-'));
      const customConnectionsKey = getStorageKey('flowchart-custom-connections');
      localStorage.setItem(customConnectionsKey, JSON.stringify(customConnections));
      return updatedEdges;
    });
  }, [nodes, setEdges]);




  return (
    <>
      {/* Status Indicators - Top Left */}
      {/* <div className="fixed left-4 z-30 bg-white rounded-lg shadow-md border border-gray-200 text-sm" style={{ top: '84px' }}>
        <div className="font-medium text-gray-700 text-sm flex items-center gap-1.5 p-3">
          <Settings size={16} className="text-blue-600" />
          <span>Status</span>
          {(isInitializing || isLoadingClickupData) && (
            <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-0.5">
              <RotateCcw size={12} className="animate-spin" />
              LOADING
            </span>
          )}
          {!isInitializing && !isLoadingClickupData && clickupData && (
            <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-0.5">
              <CheckCircle size={12} />
              CLICKUP
            </span>
          )}
          {!isInitializing && !isLoadingClickupData && !clickupData && (
            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-0.5">
              <XCircle size={12} />
              ERROR
            </span>
          )}
        </div>
      </div> */}

      {/* Professional Website Header */}
      <header className="fixed top-0 left-0 w-full bg-white z-20 border-b border-gray-200 shadow-sm" style={{ height: '72px' }}>
        <div className="flex items-center justify-between h-full px-6">
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="https://siliconsigns.com/wp-content/uploads/2024/02/cropped-logo_new-235x37.png"
                alt="Silicon Signs Logo"
                className="w-32 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">FlowChart</span>
                <span className="text-xs text-gray-500 -mt-1">Project Management</span>
              </div>
            </div>

            {/* Header Dropdowns */}
            <nav className="hidden md:flex items-center space-x-6">
              {/* Legend Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveHeaderDropdown(activeHeaderDropdown === 'legend' ? null : 'legend')}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-sm font-medium">Legend</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderDropdown === 'legend' ? 'rotate-180' : ''}`} />
                </button>

                {activeHeaderDropdown === 'legend' && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
                    <div className="space-y-4">
                      <div className="font-semibold text-sm text-gray-800 mb-3">Node Types</div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded"></div>
                          <span className="text-sm text-gray-700">Automation Steps</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-orange-100 border-2 border-orange-600 rounded border-dashed"></div>
                          <span className="text-sm text-gray-700">Decision Points</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-green-100 border-2 border-green-600 rounded-lg"></div>
                          <span className="text-sm text-gray-700">Milestones (Double-click to expand)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-purple-100 border-2 border-purple-600 rounded-sm"></div>
                          <span className="text-sm text-gray-700">Individual Tasks</span>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="font-semibold text-sm text-gray-800 mb-2">Status Colors</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-700">Completed (100%)</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-orange-500 rounded"></div>
                            <span className="text-sm text-gray-700">In Progress</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-purple-500 rounded"></div>
                            <span className="text-sm text-gray-700">Not Started</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setActiveHeaderDropdown(activeHeaderDropdown === 'controls' ? null : 'controls')}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Controls</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${activeHeaderDropdown === 'controls' ? 'rotate-180' : ''}`} />
                </button>

                {activeHeaderDropdown === 'controls' && (
                  <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[320px]">
                    <div className="space-y-4">
                      <div className="font-semibold text-sm text-gray-800 mb-3">View Controls</div>

                      <div className="space-y-3">
                        <button
                          onClick={() => { toggleAllTasks(); setActiveHeaderDropdown(null); }}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {showAllTasks ? <FolderOpen size={16} /> : <Folder size={16} />}
                            <span className="text-sm font-medium">{showAllTasks ? 'Collapse Tasks' : 'Expand Tasks'}</span>
                          </div>
                        </button>

                        <button
                          onClick={() => { setShowHandles(!showHandles); setActiveHeaderDropdown(null); }}
                          className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Link size={16} />
                            <span className="text-sm font-medium">{showHandles ? 'Hide Handles' : 'Show Handles'}</span>
                          </div>
                        </button>

                        <div className="p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} />
                            <span className="text-sm font-medium">Calendar Opacity</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={calendarOpacity}
                            onChange={(e) => setCalendarOpacity(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-xs text-gray-500 text-center mt-1">{Math.round(calendarOpacity * 100)}%</div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="font-semibold text-sm text-gray-800 mb-2">Navigation</div>
                        <select
                          onChange={(e) => {
                            const level = parseInt(e.target.value);
                            if (level === 0) resetView();
                            else focusLevel(level);
                            setActiveHeaderDropdown(null);
                            e.target.value = "0";
                          }}
                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="0">📍 Jump to Level</option>
                          <option value="1">📍 CRM Logic</option>
                          <option value="2">📍 Project Phases</option>
                          <option value="3">📍 Task Details</option>
                        </select>
                      </div>

                      <div className="border-t pt-3">
                        <div className="font-semibold text-sm text-gray-800 mb-2">Actions</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => { saveCurrentLayoutAsDefault(); setActiveHeaderDropdown(null); }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          >
                            <Save size={14} />
                            <span className="text-sm">Save Layout</span>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const processedData = await clickupApi.getProcessedTemplateData();
                                alert(`✅ API Test Complete! Found ${processedData.summary.totalTasks} tasks across ${processedData.summary.totalPhases} phases. Check console for details.`);
                              } catch (error) {
                                console.error('❌ Manual API test failed:', error);
                                alert(`❌ API Test Failed: ${error.message}`);
                              }
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                          >
                            <TestTube size={14} />
                            <span className="text-sm">Test ClickUp API</span>
                          </button>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="font-semibold text-sm text-gray-800 mb-2">Reset Options</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => { resetView(); setActiveHeaderDropdown(null); }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            <RotateCcw size={14} />
                            <span className="text-sm">Reset View</span>
                          </button>
                          <button
                            onClick={() => {
                              const key = getStorageKey('flowchart-node-positions');
                              localStorage.removeItem(key);
                              setNodes(getVisibleNodes());
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            <MapPin size={14} />
                            <span className="text-sm">Reset Positions</span>
                          </button>
                          <button
                            onClick={() => {
                              const key = getStorageKey('flowchart-handle-configs');
                              localStorage.removeItem(key);
                              setNodeHandleConfigs({});
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            <Link size={14} />
                            <span className="text-sm">Reset Handles</span>
                          </button>
                          <button
                            onClick={() => {
                              const customConnectionsKey = getStorageKey('flowchart-custom-connections');
                              const connectionModsKey = getStorageKey('flowchart-connection-mods');
                              localStorage.removeItem(customConnectionsKey);
                              localStorage.removeItem(connectionModsKey);
                              setEdges(getVisibleEdges());
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            <Link size={14} />
                            <span className="text-sm">Reset Connections</span>
                          </button>
                          <button
                            onClick={() => {
                              const key = getStorageKey('flowchart-node-labels');
                              localStorage.removeItem(key);
                              setNodeLabels({});
                              setActiveHeaderDropdown(null);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                          >
                            <RotateCcw size={14} />
                            <span className="text-sm">Reset Text</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Center Section - Project Title */}
          <div className="flex-1 flex justify-center">
            <div className="text-center max-w-md">
              <h1 className="text-lg font-semibold text-gray-900">
                Franchise Project Template
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProject ?
                  `Viewing for: ${selectedProject.customerFolder} • ${selectedProject.name}` :
                  'Standard franchise project workflow'
                }
                {/* 📅 Timeline status indicator */}
                {clickupData?.timeline && (
                  <span className="block px-2 py-1 text-blue-700 rounded-md text-xs font-medium">
                    Timeline: <span className='capitalize'>{clickupData.timeline.timelineType}</span>
                    ({clickupData.timeline.duration} days)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-4">
            {/* Project Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProjectDropdown(!showProjectDropdown);
                  setActiveHeaderDropdown(null);
                  // Clear search and reset folder states when opening
                  if (!showProjectDropdown) {
                    setSearchTerm('');
                    setExpandedFolders(new Set());
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Briefcase className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium max-w-32 truncate">
                  {selectedProject ? `${selectedProject.customerFolder} • ${selectedProject.name}` : isLoadingProjects ? 'Loading...' : 'Select Location'}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
                {isLoadingProjects && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
              </button>

              {showProjectDropdown && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[320px] max-h-[400px] overflow-hidden flex flex-col">
                  {/* Header and Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="font-semibold text-sm text-gray-800 mb-2">Franchise Locations</div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search folders or locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Loading State */}
                    {isLoadingProjects && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                        <span className="text-sm text-gray-600">Loading locations...</span>
                      </div>
                    )}

                    {/* Franchise Locations by Customer (Collapsible) */}
                    {!isLoadingProjects && projects.length > 0 && (
                      <div className="space-y-1">
                        {(() => {
                          // Group filtered projects by customer folder
                          const filteredProjects = getFilteredProjects();
                          const groupedProjects = filteredProjects.reduce((groups, project) => {
                            const customerFolder = project.customerFolder || 'Other';
                            if (!groups[customerFolder]) {
                              groups[customerFolder] = [];
                            }
                            groups[customerFolder].push(project);
                            return groups;
                          }, {});

                          return Object.entries(groupedProjects)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([customerFolder, locations]) => {
                              const isExpanded = expandedFolders.has(customerFolder);

                              return (
                                <div key={customerFolder} className="mb-1">
                                  {/* Customer Folder Header - Clickable */}
                                  <button
                                    onClick={() => toggleFolder(customerFolder)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <ChevronDown
                                        className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'
                                          }`}
                                      />
                                      <Folder className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm font-semibold text-gray-800">
                                        {customerFolder}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                      {locations.length}
                                    </span>
                                  </button>

                                  {/* Locations within this customer - Collapsible */}
                                  {isExpanded && (
                                    <div className="ml-6 mt-1 space-y-1">
                                      {locations.map((project) => (
                                        <button
                                          key={project.id}
                                          onClick={() => handleProjectSelect(project)}
                                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedProject?.id === project.id
                                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                                            : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium truncate">{project.name}</div>
                                              <div className="text-xs text-gray-500">
                                                {project.taskCount} tasks
                                              </div>
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                        })()}
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingProjects && projects.length === 0 && (
                      <div className="text-center py-8">
                        <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-1">No franchise locations found</div>
                        <div className="text-xs text-gray-500">Check your ClickUp Projects space</div>
                      </div>
                    )}

                    {/* No Search Results */}
                    {!isLoadingProjects && projects.length > 0 && getFilteredProjects().length === 0 && (
                      <div className="text-center py-8">
                        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <div className="text-sm text-gray-600 mb-1">No matches found</div>
                        <div className="text-xs text-gray-500">Try a different search term</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="hidden lg:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* System Status */}
            <div className="relative p-2 text-gray-500 rounded-lg">
              {(isInitializing || isLoadingClickupData) ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-amber-600 font-medium">Loading</span>
                </div>
              ) : clickupData ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600 font-medium">Offline</span>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Project Manager</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden - Legend moved to header */}

      {/* Clean Context Menu for Handle Configuration */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-[1000] min-w-[350px] max-w-[400px] max-h-[80vh] overflow-y-auto"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 600), // Prevent going off bottom
            left: Math.min(contextMenu.x, window.innerWidth - 420), // Prevent going off right
          }}
        >
          <div className="font-semibold mb-3 text-sm text-gray-800 flex items-center gap-2">
            <Edit size={16} className="text-blue-600" />
            <span>Edit Node</span>
          </div>

          {/* Date Information Section - Compact Layout */}
          {contextMenu.nodeId.startsWith('task-') && (
            <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800 mb-2 font-semibold flex items-center gap-1">
                <Calendar size={12} />
                Timeline Info
              </div>
              {(() => {
                // Find the task data from contextMenu nodeId
                const taskId = contextMenu.nodeId.replace('task-', '');
                const allTasks = clickupData?.phases?.flatMap(phase => phase.tasks) || [];
                const taskData = allTasks.find(task => task.id === taskId);

                if (!taskData) {
                  return <div className="text-xs text-gray-500">No data available</div>;
                }

                return (
                  <div className="space-y-1.5 text-xs">
                    {/* Dates Row */}
                    <div className="grid grid-cols-2 gap-2">

                      {/* Start Date */}
                      {taskData.startDate && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-600">Start:</span>
                          <span className="text-gray-800 font-medium text-xs">
                            {new Date(parseInt(taskData.startDate)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      {taskData.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-600">Due:</span>
                          <span className="text-gray-800 font-medium text-xs">
                            {new Date(parseInt(taskData.dueDate)).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress & Duration Row */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Progress */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${taskData.percentComplete === 100 ? 'bg-green-500' :
                          taskData.percentComplete > 0 ? 'bg-orange-500' : 'bg-gray-400'
                          }`}></div>
                        <span className="text-gray-600">Progress:</span>
                        <span className="text-gray-800 font-medium">{taskData.percentComplete}%</span>
                      </div>

                      {/* Duration */}
                      {taskData.timeEstimateDays && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="text-gray-800 font-medium">{taskData.timeEstimateDays}d</span>
                        </div>
                      )}
                    </div>

                    {/* Phase Row */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-blue-200">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-600">Phase:</span>
                      <span className="text-gray-800 font-medium truncate">{taskData.phaseName}</span>
                    </div>

                    {/* No dates message */}
                    {!taskData.dueDate && !taskData.startDate && !taskData.timeEstimateDays && (
                      <div className="text-xs text-gray-500 italic">
                        No timeline data set
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Text Editing Section */}
          <div className="mb-5">
            <div className="text-xs text-gray-600 mb-2 font-medium">
              Edit Node Text:
            </div>
            <input
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  saveEditedText(contextMenu.nodeId);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2.5 outline-none transition-colors duration-150 ease-in-out bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter new text..."
              autoFocus
            />
            <button
              onClick={() => saveEditedText(contextMenu.nodeId)}
              className="w-full min-w-fit px-3 py-2 border-none rounded-md bg-emerald-500 text-white cursor-pointer text-sm font-medium mb-4 transition-opacity duration-150 ease-in-out flex items-center justify-center gap-1.5 hover:opacity-90"
            >
              <Save size={14} />
              <span>Save Text</span>
            </button>
          </div>

          {/* Handles Section */}
          <div className="text-xs text-gray-600 mb-2.5 font-medium">
            Connection Handles (click to toggle):
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {['top', 'right', 'bottom', 'left'].map(position => {
              const getIcon = (pos) => {
                switch (pos) {
                  case 'top': return <ArrowUp size={12} />;
                  case 'right': return <ArrowRight size={12} />;
                  case 'bottom': return <ArrowDown size={12} />;
                  case 'left': return <ArrowLeft size={12} />;
                  default: return null;
                }
              };

              return (
                <button
                  key={position}
                  onClick={() => toggleNodeHandle(contextMenu.nodeId, position)}
                  className={`px-3 py-2 border-none rounded-md text-white cursor-pointer text-sm font-medium transition-opacity duration-150 ease-in-out flex items-center justify-center gap-1 hover:opacity-90 ${contextMenu.currentConfig[position] ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                >
                  {getIcon(position)}
                  <span>{position.charAt(0).toUpperCase() + position.slice(1)}</span>
                  {contextMenu.currentConfig[position] ? <Check size={12} /> : <X size={12} />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => resetNodeHandles(contextMenu.nodeId)}
              className="px-3 py-2 border-none rounded-md bg-blue-500 text-white cursor-pointer text-sm font-medium flex-1 transition-opacity duration-150 ease-in-out flex items-center justify-center gap-1.5 hover:opacity-90"
            >
              <RotateCcw size={14} />
              <span>Reset All</span>
            </button>
            <button
              onClick={closeContextMenu}
              className="px-3 py-2 border-none rounded-md bg-gray-500 text-white cursor-pointer text-sm font-medium flex-1 transition-opacity duration-150 ease-in-out flex items-center justify-center gap-1.5 hover:opacity-90"
            >
              <X size={14} />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Scroll Back To Content Button */}
      {isOutOfBounds && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-[#1976d2] text-white px-5 py-3 rounded-full cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(25,118,210,0.3)] flex items-center gap-2 transition-all duration-200 ease-in-out border-none"
          onClick={resetView}
        >
          <span>Scroll Back To Content</span>
        </div>
      )}

      {/* Loading State */}
      {(isInitializing || isLoadingClickupData) && (
        <div className="fixed inset-0 bg-slate-50/95 backdrop-blur-sm flex items-center justify-center z-[2000]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-4 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" size={24} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {isInitializing ? 'Initializing Application' : 'Loading Project Data'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {isInitializing
                ? 'Loading franchise locations and project data from ClickUp workspace...'
                : 'Loading project phases and tasks from ClickUp workspace...'
              }
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-150"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse animation-delay-300"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isInitializing && !isLoadingClickupData && !clickupData && (
        <div className="fixed inset-0 bg-slate-50/95 backdrop-blur-sm flex items-center justify-center z-[2000]">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-lg mx-4 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">ClickUp Data Unavailable</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Unable to load ClickUp project data. Please check your API token configuration and internet connection.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">Connection Failed</p>
                  <p className="text-xs text-red-600">Verify your ClickUp API token and network connectivity</p>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                setIsInitializing(true);
                setSelectedProject(null);
                setProjects([]);
                // Restart the initialization process
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white border-none px-6 py-3 rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2 mx-auto transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw size={16} />
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      )}

      {/* ReactFlow Container with Calendar Background */}
      <div className="reactflow-wrapper relative" style={{
        width: Math.max(timelineWidth, window.innerWidth),
        height: '100vh',
        minWidth: '100vw'
      }}>
        {/* Calendar Background */}
        <CalendarBackground
          calendarOpacity={calendarOpacity}
          timeline={clickupData?.timeline}
          timelineColumns={timelineColumns}
          timelineWidth={timelineWidth}
          currentViewport={currentViewport}
        />

        {/* Timeline Headers Overlay - Part of unified calendar system */}
        {timelineColumns && timelineColumns.length > 0 && (
          <div
            className="absolute top-0 left-0 h-full pointer-events-none z-[15]"
            style={{
              width: timelineWidth || Math.max(1600, window.innerWidth),
              height: '100%',
              // 📅 Apply only horizontal pan and zoom to entire calendar system
              transform: `translateX(${currentViewport.x}px) scale(${currentViewport.zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <div className="absolute top-0 left-0 h-full flex">
              {timelineColumns.map((column, index) => (
                <div
                  key={index}
                  className="flex-none relative"
                  style={{ width: `${column.width}px` }}
                >
                  {/* Timeline Header - Zoom-compensated positioning */}
                  <div 
                    className="text-center py-4 px-2 bg-white border-r border-gray-200 relative z-[20] border-b"
                    style={{
                      // 📅 Dynamic margin-top that compensates for zoom to keep headers at consistent screen position
                      marginTop: `${70 / currentViewport.zoom}px`
                    }}
                  >
                    <div
                      style={{
                        color: `rgba(107, 114, 128, ${calendarOpacity})` // text-gray-500
                      }}
                      className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1"
                    >
                      {column.dayName}
                    </div>
                    <div
                      style={{ color: `rgba(17, 24, 39, ${calendarOpacity})` }} // text-gray-900
                      className="text-3xl font-bold leading-none"
                    >
                      {column.dayNumber}
                    </div>
                    <div
                      style={{ color: `rgba(156, 163, 175, ${calendarOpacity})` }} // text-gray-400
                      className="text-xs mt-1"
                    >
                      {column.month}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ReactFlow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onViewportChange={handleViewportChange}
          defaultViewport={loadSavedViewport()}
          className={`bg-[#f8f9fa] w-full h-full`}
          nodeTypes={nodeTypes}
          multiSelectionKeyCode="Shift"
          panOnDrag={[1, 2]}
          panOnScroll
          deleteKeyCode={["Backspace", "Delete"]}
          onPaneClick={() => {
            closeContextMenu();
            closeDropdown();
            setActiveHeaderDropdown(null);
            if (showProjectDropdown) {
              setShowProjectDropdown(false);
              setSearchTerm('');
              setExpandedFolders(new Set());
            }
          }}
          connectionMode="loose"
          connectOnClick={false}
          style={{
            position: 'relative',
            zIndex: 1,
            width: Math.max(timelineWidth, window.innerWidth),
            height: '100vh'
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </>
  );
};