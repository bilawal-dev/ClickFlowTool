// 📅 Timeline Positioning Utilities
// Handles positioning of phases and tasks based on timeline columns

// Calculate total timeline width from columns
export const calculateTimelineWidth = (timelineColumns) => {
  if (!timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ No timeline columns provided, using default width');
    return Math.max(1600, window.innerWidth); // Ensure at least screen width
  }
  
  const totalWidth = timelineColumns.reduce((sum, column) => {
    const columnWidth = column.width || 120; // Fallback width
    return sum + columnWidth;
  }, 0);
  
  // Ensure minimum width and add some padding
  const finalWidth = Math.max(totalWidth + 200, window.innerWidth); // Add 200px padding
  return finalWidth;
};

// 🎯 Calculate smart initial viewport positioning
export const calculateSmartInitialViewport = (timelineColumns, clickupData) => {
  // Default fallback viewport
  const defaultViewport = { x: 10, y: 250, zoom: 0.75 };
  
  if (!timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ No timeline columns available for smart positioning');
    return defaultViewport;
  }

  const today = new Date();
  
  // Find the column closest to today's date
  let closestColumnIndex = 0;
  let closestDistance = Math.abs(today - timelineColumns[0].date);
  
  for (let i = 1; i < timelineColumns.length; i++) {
    const distance = Math.abs(today - timelineColumns[i].date);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestColumnIndex = i;
    }
  }

  // Calculate the x position of the current week/month column
  const currentColumnX = timelineColumns.slice(0, closestColumnIndex).reduce((sum, col) => {
    return sum + (col.width || 120);
  }, 0);

  // Center the viewport on the current time period
  // Account for screen width to center the current column
  const screenWidth = window.innerWidth;
  const centerOffset = screenWidth / 2;
  
  // Position so current column is roughly in center of screen
  const targetX = -(currentColumnX - centerOffset);
  
  // Determine optimal zoom level based on timeline span and active phases
  let optimalZoom = 0.75; // Default zoom
  
  if (clickupData && clickupData.phases) {
    // If we have phase data, try to fit active phases in view
    const activePhases = clickupData.phases.filter(phase => 
      phase.startDate && phase.endDate &&
      (phase.startDate <= today && phase.endDate >= today) || // Currently active
      (phase.startDate > today && phase.startDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) // Starting within 30 days
    );
    
    if (activePhases.length > 0) {
      // Calculate span needed to show active phases
      const phaseDates = [];
      activePhases.forEach(phase => {
        if (phase.startDate) phaseDates.push(phase.startDate);
        if (phase.endDate) phaseDates.push(phase.endDate);
      });
      
      const earliestDate = new Date(Math.min(...phaseDates));
      const latestDate = new Date(Math.max(...phaseDates));
      
      // Find column indices for phase span
      const startColumnIndex = getColumnIndexForDate(earliestDate, timelineColumns);
      const endColumnIndex = getColumnIndexForDate(latestDate, timelineColumns);
      
      // Calculate width needed to show this span
      const spanWidth = timelineColumns.slice(startColumnIndex, endColumnIndex + 1)
        .reduce((sum, col) => sum + (col.width || 120), 0);
      
      // Adjust zoom to fit the span with some padding
      const availableWidth = screenWidth * 0.8; // Use 80% of screen width
      if (spanWidth > availableWidth) {
        optimalZoom = Math.max(0.3, availableWidth / spanWidth);
      } else {
        optimalZoom = Math.min(1.2, availableWidth / spanWidth);
      }
    }
  }
  
  // For monthly view, use a more zoomed out approach
  if (timelineColumns[0] && timelineColumns[0].type === 'month') {
    optimalZoom = Math.max(0.5, optimalZoom * 0.8);
  }
  
  console.log(`📍 Smart positioning: Current column ${closestColumnIndex}, X: ${targetX}, Zoom: ${optimalZoom}`);
  
  return {
    x: Math.max(targetX, -timelineColumns.length * 200), // Don't go too far left
    y: 250, // Keep same Y position
    zoom: optimalZoom
  };
};

// Find which column index a date should be positioned in
export const getColumnIndexForDate = (date, timelineColumns) => {
  if (!date || !timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ Invalid date or timeline columns for positioning');
    return 0;
  }

  const targetDate = new Date(typeof date === 'string' ? parseInt(date) : date);
  
  // Find the best matching column
  for (let i = 0; i < timelineColumns.length; i++) {
    const column = timelineColumns[i];
    const columnDate = new Date(column.date);
    
    switch (column.type) {
      case 'day':
        // For daily columns, check if it's the same day
        if (targetDate.toDateString() === columnDate.toDateString()) {
          return i;
        }
        break;
        
      case 'week':
        // For weekly columns, check if date falls within the week
        const weekEnd = column.endDate || new Date(columnDate.getTime() + 4 * 24 * 60 * 60 * 1000);
        if (targetDate >= columnDate && targetDate <= weekEnd) {
          return i;
        }
        break;
        
      case 'month':
        // For monthly columns, check if same month/year
        if (targetDate.getMonth() === columnDate.getMonth() && 
            targetDate.getFullYear() === columnDate.getFullYear()) {
          return i;
        }
        break;
    }
  }
  
  // If no exact match found, find the closest column
  let closestIndex = 0;
  let closestDistance = Math.abs(targetDate - timelineColumns[0].date);
  
  for (let i = 1; i < timelineColumns.length; i++) {
    const distance = Math.abs(targetDate - timelineColumns[i].date);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }
  
  return closestIndex;
};

// Calculate phase position to stretch across its duration
export const calculatePhasePosition = (phase, timelineColumns) => {
  if (!phase || !timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ Invalid phase or timeline columns for positioning');
    return { x: 150, width: 200 }; // Default fallback position
  }

  // Get tasks with dates to calculate phase span
  const tasksWithDates = phase.tasks.filter(task => task.dueDate || task.startDate);
  
  if (tasksWithDates.length === 0) {
    // No dates available, use default positioning
    const defaultX = 150 + (phase.phase * 250);
    return { x: defaultX, width: 200 };
  }

  // Find earliest start and latest end dates
  const dates = [];
  tasksWithDates.forEach(task => {
    if (task.startDate) dates.push(new Date(parseInt(task.startDate)));
    if (task.dueDate) dates.push(new Date(parseInt(task.dueDate)));
  });

  const startDate = new Date(Math.min(...dates));
  const endDate = new Date(Math.max(...dates));

  // Get column indices for start and end
  const startColumnIndex = getColumnIndexForDate(startDate, timelineColumns);
  const endColumnIndex = getColumnIndexForDate(endDate, timelineColumns);

  // Calculate position and width
  const startColumn = timelineColumns[startColumnIndex];
  const endColumn = timelineColumns[endColumnIndex];
  
  if (!startColumn || !endColumn) {
    console.warn(`⚠️ Could not find timeline columns for phase ${phase.phase}`);
    return { x: 150 + (phase.phase * 250), width: 200 };
  }

  // Calculate x position (sum of widths of all columns before start)
  const x = timelineColumns.slice(0, startColumnIndex).reduce((sum, col) => sum + (col.width || 120), 0);
  
  // Calculate width (sum of widths from start to end column, inclusive)
  const width = timelineColumns.slice(startColumnIndex, endColumnIndex + 1).reduce((sum, col) => sum + (col.width || 120), 0);

  return { x: Math.max(x, 50), width: Math.max(width, 200) }; // Ensure minimum values
};

// Calculate task position based on due date with vertical stacking
export const calculateTaskPosition = (task, timelineColumns, stackIndex = 0) => {
  if (!task || !timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ Invalid task or timeline columns for positioning');
    return { x: 150, y: 760 }; // Default fallback position
  }

  // Use due date first, then start date
  const taskDate = task.dueDate || task.startDate;
  
  if (!taskDate) {
    // No date available, use default positioning based on phase
    const defaultX = 150 + (task.phase * 200);
    const defaultY = 760 + (stackIndex * 80);
    return { x: defaultX, y: defaultY };
  }

  // Get column index for the task date
  const columnIndex = getColumnIndexForDate(taskDate, timelineColumns);
  const column = timelineColumns[columnIndex];
  
  if (!column) {
    console.warn(`⚠️ Could not find timeline column for task "${task.name}"`);
    return { x: 150, y: 760 + (stackIndex * 80) };
  }

  // Calculate x position (center of the column)
  const x = timelineColumns.slice(0, columnIndex).reduce((sum, col) => sum + (col.width || 120), 0) + (column.width / 2) - 70; // Center and offset for node width
  
  // Calculate y position with stacking
  const baseY = 760;
  const y = baseY + (stackIndex * 80);

  return { x: Math.max(x, 50), y }; // Ensure minimum x position
};

// Group tasks by their timeline column for proper stacking
export const groupTasksByColumn = (tasks, timelineColumns) => {
  if (!tasks || !timelineColumns || timelineColumns.length === 0) {
    console.warn('⚠️ Invalid tasks or timeline columns for grouping');
    return {};
  }

  const groupedTasks = {};

  tasks.forEach(task => {
    const taskDate = task.dueDate || task.startDate;
    
    if (taskDate) {
      const columnIndex = getColumnIndexForDate(taskDate, timelineColumns);
      
      if (!groupedTasks[columnIndex]) {
        groupedTasks[columnIndex] = [];
      }
      
      groupedTasks[columnIndex].push(task);
    }
  });

  // Sort tasks within each column by task name for consistent ordering
  Object.keys(groupedTasks).forEach(columnIndex => {
    groupedTasks[columnIndex].sort((a, b) => a.name.localeCompare(b.name));
  });

  const totalGroups = Object.keys(groupedTasks).length;
  const totalTasks = Object.values(groupedTasks).reduce((sum, group) => sum + group.length, 0);

  return groupedTasks;
}; 