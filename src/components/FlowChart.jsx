import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, useNodesState, useEdgesState, useReactFlow, Handle, Position } from '@xyflow/react';
import UniversalNode from './UniversalNode';
import HeaderNode from './HeaderNode';
import LegendPanel from './LegendPanel';
import { clickupApi, KNOWN_IDS, PHASE_MAPPING } from '../services/clickupApi';


// Node type mapping for ReactFlow - ALL use Universal node with full handle support
const nodeTypes = {
  horizontalFlow: UniversalNode,
  decision: UniversalNode,
  milestone: UniversalNode,
  task: UniversalNode,
  levelDrop: UniversalNode,
  header: HeaderNode  // Headers don't need handles
};

export default function FlowChart() {
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showHandles, setShowHandles] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [nodeHandleConfigs, setNodeHandleConfigs] = useState({});
  const [nodeLabels, setNodeLabels] = useState({});
  const [editingText, setEditingText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHandToolActive, setIsHandToolActive] = useState(false);
  const [isOutOfBounds, setIsOutOfBounds] = useState(false);
  const [clickupData, setClickupData] = useState(null);
  const [isLoadingClickupData, setIsLoadingClickupData] = useState(true);
  const reactFlowInstance = useReactFlow();

  // Handle keyboard events for hand tool
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only activate if not editing text and H key is pressed
      if (event.key.toLowerCase() === 'h' && !contextMenu && document.activeElement.tagName !== 'INPUT') {
        event.preventDefault();
        setIsHandToolActive(true);
      }
    };

    const handleKeyUp = (event) => {
      if (event.key.toLowerCase() === 'h') {
        event.preventDefault();
        setIsHandToolActive(false);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [contextMenu]);

  // Load saved viewport from localStorage
  const loadSavedViewport = () => {
    try {
      const saved = localStorage.getItem('flowchart-viewport');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loading saved viewport:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading viewport:', error);
    }
    console.log('Using default viewport');
    return { x: 0, y: 0, zoom: 0.75 };
  };

  // Load saved node positions from localStorage
  const loadSavedNodePositions = () => {
    try {
      const saved = localStorage.getItem('flowchart-node-positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loading saved node positions:', Object.keys(parsed).length, 'nodes');
        return parsed;
      }
    } catch (error) {
      console.error('Error loading node positions:', error);
    }
    console.log('Using default node positions');
    return {};
  };

  // Save viewport to localStorage
  const saveViewport = useCallback((viewport) => {
    try {
      console.log('Saving viewport:', viewport);
      localStorage.setItem('flowchart-viewport', JSON.stringify(viewport));
    } catch (error) {
      console.error('Error saving viewport:', error);
    }
  }, []);

  // Save node positions to localStorage
  const saveNodePositions = useCallback((nodes) => {
    try {
      const positions = {};
      nodes.forEach(node => {
        positions[node.id] = node.position;
      });
      console.log('Saving node positions:', Object.keys(positions).length, 'nodes');
      localStorage.setItem('flowchart-node-positions', JSON.stringify(positions));
    } catch (error) {
      console.error('Error saving node positions:', error);
    }
  }, []);

  // Load saved handle configurations from localStorage
  const loadSavedHandleConfigs = () => {
    try {
      const saved = localStorage.getItem('flowchart-handle-configs');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loading saved handle configs:', Object.keys(parsed).length, 'nodes');
        setNodeHandleConfigs(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading handle configs:', error);
    }
    console.log('Using default handle configs');
    return {};
  };

  // Save handle configurations to localStorage
  const saveHandleConfigs = useCallback((configs) => {
    try {
      console.log('Saving handle configs:', Object.keys(configs).length, 'nodes');
      localStorage.setItem('flowchart-handle-configs', JSON.stringify(configs));
      setNodeHandleConfigs(configs);
    } catch (error) {
      console.error('Error saving handle configs:', error);
    }
  }, []);

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

  // Default node positions - now using real ClickUp data when available
  const getDefaultNodes = () => {
    const savedPositions = loadSavedNodePositions();
    const customDefaults = loadDefaultPositions();
    const handleConfigs = nodeHandleConfigs;
    const savedLabels = nodeLabels;

    // Level headers with better spacing - use custom defaults if available
    const levelHeaders = [
      { id: 'level1-header', type: 'header', position: customDefaults['level1-header'] || { x: 50, y: 20 }, data: { label: '🔄 LEVEL 1: CRM LOGIC FLOW' }, style: nodeStyles.levelHeader },
      { id: 'level2-header', type: 'header', position: customDefaults['level2-header'] || { x: 50, y: 380 }, data: { label: '🎯 LEVEL 2: PROJECT PHASES (ClickUp)' }, style: nodeStyles.levelHeader },
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

    // LEVEL 2: Only generate from real ClickUp data - no fallback
    let level2Nodes = [];
    if (clickupData && clickupData.phases) {
      console.log('🎯 Generating nodes from ClickUp data:', clickupData.phases.length, 'phases');

      // Generate phase nodes with dynamic positioning
      level2Nodes = clickupData.phases.map((phase, index) => {
        const nodeId = `phase-${phase.phase}`;
        const xPosition = 150 + (index * 300); // Space them horizontally

        // Create milestone style with phase colors
        const phaseStyle = {
          ...nodeStyles.milestone,
          border: `3px solid ${phase.color}`,
        };

        return {
          id: nodeId,
          type: 'milestone',
          position: customDefaults[nodeId] || { x: xPosition, y: 460 },
          data: {
            label: `${phase.emoji} Phase ${phase.phase}\n${phase.name}\n(${phase.totalTasks} tasks, ${phase.averageCompletion}%)\n(Click to expand)`,
            phaseData: phase // Store phase data for reference
          },
          style: phaseStyle
        };
      });
    }

    // LEVEL 3: Only generate from real ClickUp data - no fallback
    let taskNodes = [];
    if (clickupData && clickupData.phases) {
      console.log('📋 Generating task nodes from ClickUp data');

      clickupData.phases.forEach((phase, phaseIndex) => {
        const baseX = 120 + (phaseIndex * 230); // Align under phase nodes

        phase.tasks.forEach((task, taskIndex) => {
          const nodeId = `task-${task.id}`;
          const xPosition = baseX + (taskIndex % 2) * 90; // Two columns under each phase
          const yPosition = 760 + Math.floor(taskIndex / 2) * 80; // Stack vertically

          // Create task style with status-based coloring
          const completionColor = task.percentComplete === 100 ? '#4caf50' :
            task.percentComplete > 0 ? '#ff9800' : '#9c27b0';

          const taskStyle = {
            ...nodeStyles.task,
            border: `2px solid ${completionColor}`,
            background: task.percentComplete === 100 ? '#e8f5e8' :
              task.percentComplete > 0 ? '#fff3e0' : '#f3e5f5'
          };

          taskNodes.push({
            id: nodeId,
            type: 'task',
            position: customDefaults[nodeId] || { x: xPosition, y: yPosition },
            data: {
              label: `${task.name}\n(${task.percentComplete}% complete)`,
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
      allNodes.push(...taskNodes);
    } else {
      expandedMilestones.forEach(milestoneId => {
        let relatedTasks = [];

        if (clickupData && clickupData.phases) {
          // For ClickUp phase nodes (e.g., "phase-0", "phase-6")
          if (milestoneId.startsWith('phase-')) {
            const phaseNumber = parseInt(milestoneId.replace('phase-', ''));
            relatedTasks = taskNodes.filter(task =>
              task.data.parentPhase === phaseNumber
            );
          }
        }
        // Note: No fallback handling since we removed hardcoded nodes

        allNodes.push(...relatedTasks);
      });
    }
    return allNodes;
  };

  const getVisibleEdges = () => {
    // Load saved connection modifications
    const savedConnectionMods = JSON.parse(localStorage.getItem('flowchart-connection-mods') || '{}');

    // Get dynamic edges based on ClickUp data
    const { levelDropEdges, level2Edges, taskEdges } = getDynamicEdges();

    // Get base edges and apply modifications
    const baseEdges = [...level1Edges, ...levelDropEdges, ...level2Edges];

    if (showAllTasks) {
      baseEdges.push(...taskEdges);
    } else {
      expandedMilestones.forEach(milestoneId => {
        let relatedEdges = [];

        if (clickupData && clickupData.phases) {
          // For ClickUp phase nodes (e.g., "phase-0", "phase-6")
          if (milestoneId.startsWith('phase-')) {
            relatedEdges = taskEdges.filter(edge =>
              edge.source === milestoneId
            );
          }
        }
        // Note: No fallback handling since we removed hardcoded edges

        baseEdges.push(...relatedEdges);
      });
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
      const savedConnections = localStorage.getItem('flowchart-custom-connections');
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
    const savedMods = JSON.parse(localStorage.getItem('flowchart-connection-mods') || '{}');
    savedMods[edgeId] = modification;
    localStorage.setItem('flowchart-connection-mods', JSON.stringify(savedMods));
  }, []);

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
          const savedConnections = JSON.parse(localStorage.getItem('flowchart-custom-connections') || '[]');
          const updatedConnections = savedConnections.filter(edge => edge.id !== edgeId);
          localStorage.setItem('flowchart-custom-connections', JSON.stringify(updatedConnections));
        } else {
          // Mark pre-existing connection as deleted
          deleteConnection(edgeId);
        }
      });
    }
  }, [onEdgesChange, deleteConnection]);

  // Load saved viewport on component mount
  useEffect(() => {
    const savedViewport = loadSavedViewport();
    if (reactFlowInstance) {
      setTimeout(() => {
        console.log('Setting viewport on mount:', savedViewport);
        reactFlowInstance.setViewport(savedViewport);
      }, 100); // Small delay to ensure ReactFlow is ready
    }
  }, [reactFlowInstance]);

  // Load saved handle configurations on component mount
  useEffect(() => {
    loadSavedHandleConfigs();
  }, []);

  // Save and load node labels
  const saveNodeLabels = (labels) => {
    setNodeLabels(labels);
    localStorage.setItem('flowchart-node-labels', JSON.stringify(labels));
  };

  const loadSavedNodeLabels = () => {
    try {
      const saved = localStorage.getItem('flowchart-node-labels');
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

  // 🔄 Load ClickUp data on component mount
  useEffect(() => {
    const loadClickUpData = async () => {
      console.log('🔄 Loading ClickUp data for flowchart...');
      setIsLoadingClickupData(true);

      try {
        const processedData = await clickupApi.getProcessedTemplateData();
        console.log('✅ ClickUp data loaded successfully:', processedData);
        setClickupData(processedData);

      } catch (error) {
        console.error('❌ Failed to load ClickUp data:', error);
        // Keep clickupData as null, will fall back to hardcoded data
      } finally {
        setIsLoadingClickupData(false);
      }
    };

    // Load data on component mount
    loadClickUpData();
  }, []); // Empty dependency array = run once on mount



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

  const handleNodeClick = (event, node) => {
    if (node.style && node.style.cursor === 'pointer') {
      const newExpanded = new Set(expandedMilestones);
      if (newExpanded.has(node.id)) {
        newExpanded.delete(node.id);
      } else {
        newExpanded.add(node.id);
      }
      setExpandedMilestones(newExpanded);
    }
  };

  const toggleAllTasks = () => {
    setShowAllTasks(!showAllTasks);
    setExpandedMilestones(new Set());
  };

  // Handle viewport changes and save to localStorage
  const handleViewportChange = useCallback((viewport) => {
    saveViewport(viewport);

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
    console.log('Saved current layout as new default:', Object.keys(defaultPositions).length, 'nodes');
    alert('✅ Current layout saved as default! This will be the new reset position.');
  };



  // Reset node positions to defaults (either custom saved defaults or original hardcoded)
  const resetNodePositions = () => {
    localStorage.removeItem('flowchart-node-positions');
    console.log('Reset node positions to defaults');
    setNodes(getVisibleNodes());
  };

  // Reset to overview
  const resetView = () => {
    const newViewport = { x: 0, y: 0, zoom: 0.75 };
    if (reactFlowInstance) {
      reactFlowInstance.setViewport(newViewport);
      saveViewport(newViewport);
    }
  };

  // Focus on specific level
  const focusLevel = (level) => {
    let newViewport;
    switch (level) {
      case 1:
        newViewport = { x: -50, y: -50, zoom: 1.0 };
        break;
      case 2:
        newViewport = { x: -50, y: -350, zoom: 1.0 };
        break;
      case 3:
        newViewport = { x: -50, y: -650, zoom: 1.0 };
        break;
      default:
        newViewport = { x: 0, y: 0, zoom: 0.75 };
    }
    if (reactFlowInstance) {
      reactFlowInstance.setViewport(newViewport);
      saveViewport(newViewport);
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

  // Close dropdown
  const closeDropdown = () => {
    setShowDropdown(false);
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

  // Start editing text for a node
  const startEditingText = (nodeId, currentText) => {
    setEditingText(currentText);
  };

  // Save edited text
  const saveEditedText = (nodeId) => {
    if (editingText.trim()) {
      updateNodeText(nodeId, editingText.trim());
    }
    setEditingText('');
    closeContextMenu();
  };

  // Modify existing connection handles
  const modifyConnectionHandles = useCallback((edgeId, newSourceHandle, newTargetHandle) => {
    saveConnectionMod(edgeId, { sourceHandle: newSourceHandle, targetHandle: newTargetHandle });
    setEdges(getVisibleEdges());
  }, [saveConnectionMod, setEdges]);

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
      console.log(`Connection blocked: Source handle '${sourcePosition}' is disabled on node ${source}`);
      return;
    }

    // Check if target handle is enabled
    const targetPosition = targetHandle?.replace('-target', '');
    if (targetPosition && !targetHandles[targetPosition]) {
      console.log(`Connection blocked: Target handle '${targetPosition}' is disabled on node ${target}`);
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

    console.log('Creating new connection:', newEdge);
    setEdges((edges) => {
      const updatedEdges = [...edges, newEdge];
      // Save custom connections to localStorage
      const customConnections = updatedEdges.filter(edge => edge.id.startsWith('custom-'));
      localStorage.setItem('flowchart-custom-connections', JSON.stringify(customConnections));
      return updatedEdges;
    });
  }, [nodes, setEdges]);

  return (
    <>
      {/* Clean Control Panel - Matching Legend Style */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: '#ffffff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        <div style={{
          fontWeight: '500',
          color: '#374151',
          marginBottom: '12px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>⚙️</span>
          <span>Controls</span>
          {isHandToolActive && (
            <span style={{
              background: '#10b981',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              ✋ HAND
            </span>
          )}
          {isLoadingClickupData && (
            <span style={{
              background: '#f59e0b',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              🔄 LOADING
            </span>
          )}
          {!isLoadingClickupData && clickupData && (
            <span style={{
              background: '#10b981',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              ✅ CLICKUP
            </span>
          )}
          {!isLoadingClickupData && !clickupData && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              ❌ ERROR
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <button
            onClick={toggleAllTasks}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'translateY(1px)';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <span>{showAllTasks ? '📁' : '📂'}</span>
            <span>{showAllTasks ? 'Collapse' : 'Expand'}</span>
          </button>

          <button
            onClick={saveCurrentLayoutAsDefault}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'translateY(1px)';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <span>💾</span>
            <span>Save Layout</span>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: '#ffffff',
                border: '1px solid #d1d5db',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = '#9ca3af';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseDown={e => {
                e.target.style.transform = 'translateY(1px)';
                e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
              }}
              onMouseUp={e => {
                e.target.style.transform = 'translateY(0px)';
              }}
            >
              <span>🔄</span>
              <span>Reset</span>
              <span style={{
                fontSize: '8px',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease'
              }}>▼</span>
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '42px',
                left: 0,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '140px',
                padding: '4px'
              }}>
                <button
                  onClick={() => { resetView(); setShowDropdown(false); }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>🔄</span>
                  <span>Reset View</span>
                </button>
                <button
                  onClick={() => { resetNodePositions(); setShowDropdown(false); }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>📍</span>
                  <span>Reset Positions</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('flowchart-handle-configs');
                    setNodeHandleConfigs({});
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>🔗</span>
                  <span>Reset Handles</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('flowchart-custom-connections');
                    localStorage.removeItem('flowchart-connection-mods');
                    setEdges(getVisibleEdges());
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>🔗</span>
                  <span>Reset Connections</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('flowchart-node-labels');
                    setNodeLabels({});
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.target.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>📝</span>
                  <span>Reset Text</span>
                </button>
              </div>
            )}
          </div>

          <select
            onChange={(e) => {
              const level = parseInt(e.target.value);
              if (level === 0) resetView();
              else focusLevel(level);
              e.target.value = "0";
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L2 5h8z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              paddingRight: '32px'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
          >
            <option value="0">📍 Navigate</option>
            <option value="1">📍 CRM</option>
            <option value="2">📍 Milestones</option>
            <option value="3">📍 Tasks</option>
          </select>

          <button
            onClick={() => setShowHandles(!showHandles)}
            style={{
              background: showHandles ? '#f3f4f6' : '#ffffff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'translateY(1px)';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <span>🔗</span>
            <span>{showHandles ? 'Hide Handles' : 'Show Handles'}</span>
          </button>

          <button
            onClick={async () => {
              console.log('🔄 Manual API test triggered...');
              try {
                const processedData = await clickupApi.getProcessedTemplateData();
                console.log('📊 Processed Data:', processedData);
                alert(`✅ API Test Complete! Found ${processedData.summary.totalTasks} tasks across ${processedData.summary.totalPhases} phases. Check console for details.`);
              } catch (error) {
                console.error('❌ Manual API test failed:', error);
                alert(`❌ API Test Failed: ${error.message}`);
              }
            }}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseDown={e => {
              e.target.style.transform = 'translateY(1px)';
              e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
            }}
            onMouseUp={e => {
              e.target.style.transform = 'translateY(0px)';
            }}
          >
            <span>🧪</span>
            <span>Test ClickUp API</span>
          </button>
        </div>
      </div>

      {/* Clean Legend Panel - Top Right */}
      <LegendPanel />

      {/* Clean Context Menu for Handle Configuration */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '16px',
            zIndex: 1000,
            minWidth: '240px'
          }}
        >
          <div style={{
            fontWeight: '600',
            marginBottom: '12px',
            fontSize: '14px',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✏️</span>
            <span>Edit Node</span>
          </div>

          {/* Text Editing Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '12px',
              color: '#4b5563',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
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
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '10px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                background: '#ffffff',
                color: '#374151'
              }}
              placeholder="Enter new text..."
              autoFocus
              onFocus={e => {
                e.target.style.borderColor = '#3b82f6';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#d1d5db';
              }}
            />
            <button
              onClick={() => saveEditedText(contextMenu.nodeId)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                width: '100%',
                marginBottom: '16px',
                transition: 'opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={e => {
                e.target.style.opacity = '1';
              }}
            >
              <span>💾</span>
              <span>Save Text</span>
            </button>
          </div>

          {/* Handles Section */}
          <div style={{
            fontSize: '12px',
            color: '#4b5563',
            marginBottom: '10px',
            fontWeight: '500'
          }}>
            Connection Handles (click to toggle):
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            {['top', 'right', 'bottom', 'left'].map(position => (
              <button
                key={position}
                onClick={() => toggleNodeHandle(contextMenu.nodeId, position)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: contextMenu.currentConfig[position]
                    ? '#10b981'
                    : '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'opacity 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
                onMouseEnter={e => {
                  e.target.style.opacity = '0.9';
                }}
                onMouseLeave={e => {
                  e.target.style.opacity = '1';
                }}
              >
                <span>{position.charAt(0).toUpperCase() + position.slice(1)}</span>
                <span>{contextMenu.currentConfig[position] ? '✓' : '✗'}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => resetNodeHandles(contextMenu.nodeId)}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                flex: 1,
                transition: 'opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={e => {
                e.target.style.opacity = '1';
              }}
            >
              <span>🔄</span>
              <span>Reset All</span>
            </button>
            <button
              onClick={closeContextMenu}
              style={{
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#6b7280',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                flex: 1,
                transition: 'opacity 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                e.target.style.opacity = '0.9';
              }}
              onMouseLeave={e => {
                e.target.style.opacity = '1';
              }}
            >
              <span>✕</span>
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Scroll Back To Content Button */}
      {isOutOfBounds && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#1976d2',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          border: 'none'
        }}
          onClick={resetView}
        >
          <span>Scroll Back To Content</span>
        </div>
      )}

      {/* Loading State */}
      {isLoadingClickupData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(248, 249, 250, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
              animation: 'spin 2s linear infinite'
            }}>
              🔄
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              Loading ClickUp Data
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Fetching real project phases and tasks from ClickUp...
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoadingClickupData && !clickupData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(248, 249, 250, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '20px'
            }}>
              ⚠️
            </div>
            <div style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '12px'
            }}>
              ClickUp Data Unavailable
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              Unable to load ClickUp project data. Please check your API token configuration and internet connection.
            </div>
            <button
              onClick={async () => {
                console.log('🔄 Retrying ClickUp data load...');
                setIsLoadingClickupData(true);
                try {
                  const processedData = await clickupApi.getProcessedTemplateData();
                  console.log('✅ ClickUp data loaded successfully on retry:', processedData);
                  setClickupData(processedData);
                } catch (error) {
                  console.error('❌ Retry failed:', error);
                } finally {
                  setIsLoadingClickupData(false);
                }
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.target.style.background = '#2563eb';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#3b82f6';
              }}
            >
              <span>🔄</span>
              <span>Retry Loading</span>
            </button>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onViewportChange={handleViewportChange}
        defaultViewport={loadSavedViewport()}
        style={{
          background: '#f8f9fa',
          cursor: isHandToolActive ? 'grab' : 'default'
        }}
        nodeTypes={nodeTypes}
        multiSelectionKeyCode="Shift"
        panOnDrag={isHandToolActive ? [0, 1, 2] : [1, 2]}
        selectionOnDrag={!isHandToolActive}
        panOnScroll
        deleteKeyCode={["Backspace", "Delete"]}
        onPaneClick={() => {
          closeContextMenu();
          closeDropdown();
        }}
        connectionMode="loose"
        connectOnClick={false}
      />
    </>
  );
};