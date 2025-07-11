const API_TOKEN = import.meta.env.VITE_CLICKUP_PERSONAL_API_TOKEN;
const BASE_URL = 'https://api.clickup.com/api/v2';

// Known IDs from franchise_template_analysis.md and ExtraInfo.md
const KNOWN_IDS = {
  teamId: '9013410499',
  templatesSpaceId: '90131823880', 
  // projectsSpaceId: '90137209740',
  projectsSpaceId: '90137498382', // Brandon's test space "Brandon's copy"
  franchiseTemplateListId: '901314428250',
  customFields: {
    percentComplete: 'e50bab98-75cd-40c2-a193-ce2811e1713b',
    phase: 'e024c849-5312-44c7-8c28-d3642fc4163a'
  }
};

// Phase mapping from franchise_template_analysis.md
const PHASE_MAPPING = {
  0: { name: 'DUE DILIGENCE/PLANNING', color: '#1bbc9c', emoji: '📊' },
  1: { name: 'DESIGN', color: '#1bbc9c', emoji: '🎨' },
  2: { name: 'FRANCHISE APPROVAL', color: '#1bbc9c', emoji: '✅' },
  3: { name: 'LANDLORD APPROVAL', color: '#1bbc9c', emoji: '🏢' },
  4: { name: 'ESTIMATING', color: '#1bbc9c', emoji: '💰' },
  5: { name: 'FRANCHISEE APPROVAL', color: '#1bbc9c', emoji: '👥' },
  6: { name: 'PERMITTING', color: '#1bbc9c', emoji: '📝' },
  7: { name: 'PRODUCTION', color: '#1bbc9c', emoji: '🏭' },
  8: { name: 'SHIPPING', color: '#1bbc9c', emoji: '🚚' },
  9: { name: 'INSTALLATION', color: '#1bbc9c', emoji: '🔧' },
  10: { name: 'PROJECT CLOSE-OUT', color: '#1bbc9c', emoji: '✅' }
};

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  console.log(`📡 ClickUp API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': API_TOKEN,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`ClickUp API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ API Response from ${endpoint}:`, data);
    return data;
    
  } catch (error) {
    console.error(`❌ API Call Failed for ${endpoint}:`, error);
    throw error;
  }
};

// 📅 Timeline Calculation Helpers
const calculateProjectTimeline = (allTasks) => {
  // Filter tasks with valid dates
  const tasksWithDates = allTasks.filter(task => task.dueDate || task.startDate);
  
  if (tasksWithDates.length === 0) {
    console.warn('⚠️ No tasks with dates found, using default timeline');
    return {
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      duration: 30,
      timelineType: 'daily'
    };
  }

  // Convert timestamps to dates and find min/max
  const dates = [];
  tasksWithDates.forEach(task => {
    if (task.startDate) dates.push(new Date(parseInt(task.startDate)));
    if (task.dueDate) dates.push(new Date(parseInt(task.dueDate)));
  });

  const startDate = new Date(Math.min(...dates));
  const endDate = new Date(Math.max(...dates));
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Determine timeline type based on duration
  let timelineType = 'daily';
  if (duration > 90) {
    timelineType = 'monthly';
  } else if (duration > 30) {
    timelineType = 'weekly';
  }

  console.log(`📅 Project Timeline: ${startDate.toDateString()} to ${endDate.toDateString()} (${duration} days, ${timelineType})`);

  return {
    startDate,
    endDate,
    duration,
    timelineType
  };
};

const calculatePhaseTimeline = (phase) => {
  const tasksWithDates = phase.tasks.filter(task => task.dueDate || task.startDate);
  
  if (tasksWithDates.length === 0) {
    return {
      startDate: null,
      endDate: null,
      duration: 0
    };
  }

  const dates = [];
  tasksWithDates.forEach(task => {
    if (task.startDate) dates.push(new Date(parseInt(task.startDate)));
    if (task.dueDate) dates.push(new Date(parseInt(task.dueDate)));
  });

  const startDate = new Date(Math.min(...dates));
  const endDate = new Date(Math.max(...dates));
  const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  return {
    startDate,
    endDate,
    duration
  };
};

export const clickupApi = {
  
  // 🔍 Discovery APIs - Find user's accessible data
  async getTeams() {
    console.log('🔎 Fetching user teams...');
    const data = await apiCall('/team');
    console.log(`📋 Found ${data.teams?.length || 0} teams:`, data.teams?.map(t => `${t.name} (${t.id})`));
    return data;
  },

  async getSpaces(teamId = KNOWN_IDS.teamId) {
    console.log(`🔎 Fetching spaces for team ${teamId}...`);
    const data = await apiCall(`/team/${teamId}/space`);
    console.log(`📁 Found ${data.spaces?.length || 0} spaces:`, data.spaces?.map(s => `${s.name} (${s.id})`));
    return data;
  },

  async getSpaceLists(spaceId = KNOWN_IDS.templatesSpaceId) {
    console.log(`🔎 Fetching lists in space ${spaceId}...`);
    const data = await apiCall(`/space/${spaceId}/list`);
    console.log(`📄 Found ${data.lists?.length || 0} lists:`, data.lists?.map(l => `${l.name} (${l.id})`));
    return data;
  },

  // 🏢 Projects Space Discovery - Use direct space ID (more robust)
  async findProjectsSpace(teamId = KNOWN_IDS.teamId) {
    console.log(`🔎 Using direct Projects space ID: ${KNOWN_IDS.projectsSpaceId}...`);

    try {
      // Fetch all spaces to verify the space exists and get its details
      const spacesData = await this.getSpaces(teamId);
      const projectsSpace = spacesData.spaces?.find(space => space.id === KNOWN_IDS.projectsSpaceId);

      if (projectsSpace) {
        console.log(`✅ Found Projects space: ${projectsSpace.name} (${projectsSpace.id})`);
        return projectsSpace;
      } else {
        console.warn(`⚠️ Projects space with ID ${KNOWN_IDS.projectsSpaceId} not found`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching Projects space:', error);
      return null;
    }
  },

  async getSpaceFolders(spaceId) {
    console.log(`📁 Fetching folders in space ${spaceId}...`);
    const data = await apiCall(`/space/${spaceId}/folder`);
    console.log(`📂 Found ${data.folders?.length || 0} folders:`, data.folders?.map(f => `${f.name} (${f.id})`));
    return data;
  },

  async getFolderLists(folderId) {
    console.log(`📄 Fetching lists in folder ${folderId}...`);
    const data = await apiCall(`/folder/${folderId}/list`);
    console.log(`📋 Found ${data.lists?.length || 0} lists:`, data.lists?.map(l => `${l.name} (${l.id})`));
    return data;
  },

  async getProjectsStructure(teamId = KNOWN_IDS.teamId) {
    console.log('🏗️ Discovering full Projects space structure...');

    try {
      // Find Projects space
      const projectsSpace = await this.findProjectsSpace(teamId);
      if (!projectsSpace) {
        throw new Error('Projects space not found');
      }

      // Get customer folders and direct lists in parallel
      const [foldersData, directListsData] = await Promise.allSettled([
        this.getSpaceFolders(projectsSpace.id),
        this.getSpaceLists(projectsSpace.id)
      ]);

      const allLocationLists = [];

      // Process customer folders in parallel
      if (foldersData.status === 'fulfilled' && foldersData.value.folders) {
        console.log(`📁 Found ${foldersData.value.folders.length} customer folders - fetching lists in parallel...`);

        // Create promises for all folder list fetches
        const folderListPromises = foldersData.value.folders.map(folder =>
          this.getFolderLists(folder.id)
            .then(listsData => ({ folder, listsData, success: true }))
            .catch(error => ({ folder, error, success: false }))
        );

        // Execute all folder list fetches in parallel
        const folderResults = await Promise.allSettled(folderListPromises);

        // Process all results
        folderResults.forEach(result => {
          if (result.status === 'fulfilled') {
            const { folder, listsData, success, error } = result.value;

            if (success && listsData.lists) {
              console.log(`✅ Processed folder: ${folder.name} (${listsData.lists.length} lists)`);

              listsData.lists.forEach(list => {
                allLocationLists.push({
                  id: list.id,
                  name: list.name,
                  customerFolder: folder.name,
                  folderId: folder.id,
                  spaceId: projectsSpace.id,
                  spaceName: projectsSpace.name,
                  taskCount: list.task_count || 0,
                  url: list.url,
                  archived: list.archived || false
                });
              });
            } else if (error) {
              console.warn(`⚠️ Could not fetch lists for folder ${folder.name}:`, error.message);
            }
          }
        });
      }

      // Process direct lists in the Projects space (no folder)
      if (directListsData.status === 'fulfilled' && directListsData.value.lists) {
        console.log(`📄 Found ${directListsData.value.lists.length} direct lists in Projects space`);

        directListsData.value.lists.forEach(list => {
          allLocationLists.push({
            id: list.id,
            name: list.name,
            customerFolder: 'No Folder', // Direct in space
            folderId: null,
            spaceId: projectsSpace.id,
            spaceName: projectsSpace.name,
            taskCount: list.task_count || 0,
            url: list.url,
            archived: list.archived || false
          });
        });
      } else if (directListsData.status === 'rejected') {
        console.warn('⚠️ Could not fetch direct lists from Projects space:', directListsData.reason?.message);
      }

      const folderCount = foldersData.status === 'fulfilled' ? foldersData.value.folders?.length || 0 : 0;
      console.log(`✅ Optimized fetch complete! Found ${allLocationLists.length} location projects across ${folderCount} customer folders`);

      return {
        projectsSpace,
        customerFolders: foldersData.status === 'fulfilled' ? foldersData.value.folders || [] : [],
        locationLists: allLocationLists.sort((a, b) =>
          a.customerFolder.localeCompare(b.customerFolder) || a.name.localeCompare(b.name)
        )
      };

    } catch (error) {
      console.error('❌ Error discovering Projects structure:', error);
      throw error;
    }
  },

  // 📋 Template Data APIs - Core functions for current task
  async getTemplateList(listId = KNOWN_IDS.franchiseTemplateListId) {
    console.log(`📋 Fetching template list details for ${listId}...`);
    const data = await apiCall(`/list/${listId}`);
    console.log(`📊 Template List Details:`, {
      name: data.name,
      id: data.id,
      space: data.space?.name,
      taskCount: data.task_count,
      url: data.url
    });
    return data;
  },

  async getTemplateTasks(listId = KNOWN_IDS.franchiseTemplateListId) {
    console.log(`📋 Fetching all tasks from template list ${listId}...`);
    const data = await apiCall(`/list/${listId}/task?include_closed=true&include_subtasks=true`);
    
    console.log(`📊 Template Tasks Summary:`);
    console.log(`  • Total tasks: ${data.tasks?.length || 0}`);
    
    if (data.tasks) {
      // Group tasks by phase for analysis
      const tasksByPhase = {};
      data.tasks.forEach(task => {
        const phaseField = task.custom_fields?.find(f => f.id === KNOWN_IDS.customFields.phase);
        // Better phase parsing - try multiple approaches
        let phaseValue = 0; // default to phase 0
        if (phaseField?.value) {
          if (typeof phaseField.value === 'number') {
            phaseValue = phaseField.value;
          } else if (phaseField.value.orderindex !== undefined) {
            phaseValue = phaseField.value.orderindex;
          } else if (phaseField.value.id) {
            // Map phase ID to index using IDs from franchise_template_analysis.md
            const phaseIdToIndex = {
              '443a83c8-d6fd-4c55-9549-97f3988de74c': 0, // DUE DILIGENCE/PLANNING
              '1c9e2046-7658-49ee-91fa-54aa6a753df6': 1, // DESIGN
              '2d6b7737-9726-47d4-8359-348b1d1324e6': 2, // FRANCHISE APPROVAL
              '26c0344c-15b7-474a-a0f3-86f323c073f9': 3, // LANDLORD APPROVAL
              '96a8714d-3989-4a40-a915-b97da07b4bc1': 4, // ESTIMATING
              '413fe4db-e5a9-4df8-9fa1-9b76169d088c': 5, // FRANCHISEE APPROVAL
              '792a6ff0-8583-4009-a38b-6c0b83412630': 6, // PERMITTING
              '77a94285-7187-41ba-8861-30e13180673a': 7, // PRODUCTION
              'cff778db-3862-4389-9caa-14a04d325edd': 8, // SHIPPING
              '61198d4d-b6a3-4df7-b758-e32932fffa24': 9, // INSTALLATION
              '9dac832b-7019-4b8a-b372-58239fffd30e': 10 // PROJECT CLOSE-OUT
            };
            phaseValue = phaseIdToIndex[phaseField.value.id] ?? 0;
          }
        }

        // DEBUG: Log what we found
        console.log(`🎯 Task "${task.name}" -> Phase ${phaseValue} (${PHASE_MAPPING[phaseValue]?.name})`);

        if (!tasksByPhase[phaseValue]) {
          tasksByPhase[phaseValue] = [];
        }
        tasksByPhase[phaseValue].push({
          id: task.id,
          name: task.name,
          status: task.status?.status,
          percentComplete: task.custom_fields?.find(f => f.id === KNOWN_IDS.customFields.percentComplete)?.value || '0'
        });
      });

      console.log(`📊 Tasks by Phase:`);
      Object.entries(tasksByPhase).forEach(([phaseIndex, tasks]) => {
        const phaseName = PHASE_MAPPING[phaseIndex]?.name || `Unknown Phase ${phaseIndex}`;
        console.log(`  • Phase ${phaseIndex} (${phaseName}): ${tasks.length} tasks`);
        tasks.forEach(task => {
          console.log(`    - ${task.name} (${task.status}, ${task.percentComplete}% complete)`);
        });
      });
    }
    
    return data;
  },

  async getTemplateCustomFields(listId = KNOWN_IDS.franchiseTemplateListId) {
    console.log(`🏷️ Fetching custom fields for list ${listId}...`);
    const data = await apiCall(`/list/${listId}/field`);
    
    console.log(`🏷️ Custom Fields Found:`);
    data.fields?.forEach(field => {
      console.log(`  • ${field.name} (${field.type}): ${field.id}`);
      if (field.type_config?.options) {
        console.log(`    Options:`, field.type_config.options.map(opt => `${opt.name} (${opt.color})`));
      }
    });
    
    return data;
  },

  async getTaskDependencies(taskId) {
    console.log(`🔗 Fetching dependencies for task ${taskId}...`);
    const data = await apiCall(`/task/${taskId}/dependency`);
    
    console.log(`🔗 Dependencies for task ${taskId}:`);
    console.log(`  • Depends on: ${data.dependencies?.length || 0} tasks`);
    console.log(`  • Dependents: ${data.dependents?.length || 0} tasks`);
    
    return data;
  },

  // 🎯 Data Processing - Transform ClickUp data for flowchart
  async getProcessedTemplateData() {
    console.log('🔄 Processing complete template data for flowchart...');
    
    try {
      // Fetch all required data
      const [listDetails, tasksData, customFields] = await Promise.all([
        this.getTemplateList(),
        this.getTemplateTasks(),
        this.getTemplateCustomFields()
      ]);

      // Process tasks by phase
      const phaseGroups = {};
      const allTasks = [];

      if (tasksData.tasks) {
        tasksData.tasks.forEach(task => {
          const phaseField = task.custom_fields?.find(f => f.id === KNOWN_IDS.customFields.phase);
          // Better phase parsing - try multiple approaches
          let phaseValue = 0; // default to phase 0
          if (phaseField?.value) {
            if (typeof phaseField.value === 'number') {
              phaseValue = phaseField.value;
            } else if (phaseField.value.orderindex !== undefined) {
              phaseValue = phaseField.value.orderindex;
            } else if (phaseField.value.id) {
              // Map phase ID to index using IDs from franchise_template_analysis.md
              const phaseIdToIndex = {
                '443a83c8-d6fd-4c55-9549-97f3988de74c': 0, // DUE DILIGENCE/PLANNING
                '1c9e2046-7658-49ee-91fa-54aa6a753df6': 1, // DESIGN
                '2d6b7737-9726-47d4-8359-348b1d1324e6': 2, // FRANCHISE APPROVAL
                '26c0344c-15b7-474a-a0f3-86f323c073f9': 3, // LANDLORD APPROVAL
                '96a8714d-3989-4a40-a915-b97da07b4bc1': 4, // ESTIMATING
                '413fe4db-e5a9-4df8-9fa1-9b76169d088c': 5, // FRANCHISEE APPROVAL
                '792a6ff0-8583-4009-a38b-6c0b83412630': 6, // PERMITTING
                '77a94285-7187-41ba-8861-30e13180673a': 7, // PRODUCTION
                'cff778db-3862-4389-9caa-14a04d325edd': 8, // SHIPPING
                '61198d4d-b6a3-4df7-b758-e32932fffa24': 9, // INSTALLATION
                '9dac832b-7019-4b8a-b372-58239fffd30e': 10 // PROJECT CLOSE-OUT
              };
              phaseValue = phaseIdToIndex[phaseField.value.id] ?? 0;
            }
          }

          // DEBUG: Log what we found
          console.log(`🎯 Task "${task.name}" -> Phase ${phaseValue} (${PHASE_MAPPING[phaseValue]?.name})`);

          const percentField = task.custom_fields?.find(f => f.id === KNOWN_IDS.customFields.percentComplete);
          const percentComplete = parseInt(percentField?.value || '0');

          const processedTask = {
            id: task.id,
            name: task.name,
            status: task.status?.status || 'to do',
            percentComplete,
            phase: phaseValue,
            phaseName: PHASE_MAPPING[phaseValue]?.name || 'Unknown Phase',
            dependencies: [], // Will be populated if needed
            url: task.url,
            creator: task.creator,
            watchers: task.watchers || []
          };

          allTasks.push(processedTask);

          if (!phaseGroups[phaseValue]) {
            phaseGroups[phaseValue] = {
              phase: phaseValue,
              name: PHASE_MAPPING[phaseValue]?.name || `Phase ${phaseValue}`,
              color: PHASE_MAPPING[phaseValue]?.color || '#666666',
              emoji: PHASE_MAPPING[phaseValue]?.emoji || '📋',
              tasks: [],
              totalTasks: 0,
              completedTasks: 0,
              averageCompletion: 0
            };
          }

          phaseGroups[phaseValue].tasks.push(processedTask);
        });

        // Calculate phase statistics
        Object.values(phaseGroups).forEach(phase => {
          phase.totalTasks = phase.tasks.length;
          phase.completedTasks = phase.tasks.filter(t => t.percentComplete === 100).length;
          const totalCompletion = phase.tasks.reduce((sum, t) => sum + t.percentComplete, 0);
          phase.averageCompletion = Math.round(totalCompletion / phase.totalTasks);
          
          // 📅 Add timeline calculations to each phase
          const phaseTimeline = calculatePhaseTimeline(phase);
          phase.timeline = phaseTimeline;
          phase.startDate = phaseTimeline.startDate;
          phase.endDate = phaseTimeline.endDate;
          phase.duration = phaseTimeline.duration;
        });
      }

      const processedData = {
        listDetails,
        phases: Object.values(phaseGroups).sort((a, b) => a.phase - b.phase),
        allTasks,
        customFields: customFields.fields || [],
        summary: {
          totalPhases: Object.keys(phaseGroups).length,
          totalTasks: allTasks.length,
          overallCompletion: Math.round(allTasks.reduce((sum, t) => sum + t.percentComplete, 0) / allTasks.length)
        }
      };

      console.log('✅ Template Data Processing Complete:');
      console.log(`  • ${processedData.summary.totalPhases} phases`);
      console.log(`  • ${processedData.summary.totalTasks} tasks`);
      console.log(`  • ${processedData.summary.overallCompletion}% overall completion`);
      
      processedData.phases.forEach(phase => {
        console.log(`  • ${phase.emoji} ${phase.name}: ${phase.totalTasks} tasks, ${phase.averageCompletion}% complete`);
      });

      return processedData;
      
    } catch (error) {
      console.error('❌ Error processing template data:', error);
      throw error;
    }
  },

  // 🚀 Project APIs - Real project data fetching
  async getUserProjects(teamId = KNOWN_IDS.teamId) {
    console.log('🔎 Fetching franchise location projects...');

    try {
      const projectsStructure = await this.getProjectsStructure(teamId);

      console.log(`✅ Found ${projectsStructure.locationLists.length} franchise locations`);
      return {
        projects: projectsStructure.locationLists,
        structure: projectsStructure
      };

    } catch (error) {
      console.error('❌ Error fetching user projects:', error);
      throw error;
    }
  },

  async getProjectTasks(projectId) {
    console.log(`📋 Fetching tasks for project ${projectId}...`);

    try {
      const data = await apiCall(`/list/${projectId}/task?include_closed=true&include_subtasks=true`);

      console.log(`📊 Project Tasks Summary for ${projectId}:`);
      console.log(`  • Total tasks: ${data.tasks?.length || 0}`);

      return data;

    } catch (error) {
      console.error(`❌ Error fetching tasks for project ${projectId}:`, error);
      throw error;
    }
  },

  async getProcessedProjectData(projectId) {
    console.log(`🔄 Processing project data for project ${projectId}...`);

    try {
      // Fetch project details and tasks
      const [projectDetails, tasksData] = await Promise.all([
        apiCall(`/list/${projectId}`),
        this.getProjectTasks(projectId)
      ]);

      // Try to get custom fields for this project
      let customFields = [];
      try {
        const fieldsData = await apiCall(`/list/${projectId}/field`);
        customFields = fieldsData.fields || [];
      } catch (error) {
        console.warn('⚠️ Could not fetch custom fields for project, using defaults');
      }

      // Process tasks similar to template processing
      const phaseGroups = {};
      const allTasks = [];

      if (tasksData.tasks) {
        tasksData.tasks.forEach(task => {
          // Try to find phase field (might have different ID than template)
          let phaseField = task.custom_fields?.find(f =>
            f.name?.toLowerCase().includes('phase') ||
            f.id === KNOWN_IDS.customFields.phase
          );

          let phaseValue = 0; // default to phase 0

          if (phaseField?.value) {
            if (typeof phaseField.value === 'number') {
              phaseValue = phaseField.value;
            } else if (phaseField.value.orderindex !== undefined) {
              phaseValue = phaseField.value.orderindex;
            } else if (phaseField.value.id) {
              // Try to map using known phase IDs, fallback to orderindex
              const phaseIdToIndex = {
                '443a83c8-d6fd-4c55-9549-97f3988de74c': 0, // DUE DILIGENCE/PLANNING
                '1c9e2046-7658-49ee-91fa-54aa6a753df6': 1, // DESIGN
                '2d6b7737-9726-47d4-8359-348b1d1324e6': 2, // FRANCHISE APPROVAL
                '26c0344c-15b7-474a-a0f3-86f323c073f9': 3, // LANDLORD APPROVAL
                '96a8714d-3989-4a40-a915-b97da07b4bc1': 4, // ESTIMATING
                '413fe4db-e5a9-4df8-9fa1-9b76169d088c': 5, // FRANCHISEE APPROVAL
                '792a6ff0-8583-4009-a38b-6c0b83412630': 6, // PERMITTING
                '77a94285-7187-41ba-8861-30e13180673a': 7, // PRODUCTION
                'cff778db-3862-4389-9caa-14a04d325edd': 8, // SHIPPING
                '61198d4d-b6a3-4df7-b758-e32932fffa24': 9, // INSTALLATION
                '9dac832b-7019-4b8a-b372-58239fffd30e': 10 // PROJECT CLOSE-OUT
              };
              phaseValue = phaseIdToIndex[phaseField.value.id] ?? phaseField.value.orderindex ?? 0;
            }
          }

          // Try to find percent complete field
          let percentField = task.custom_fields?.find(f =>
            f.name?.toLowerCase().includes('complete') ||
            f.name?.toLowerCase().includes('%') ||
            f.id === KNOWN_IDS.customFields.percentComplete
          );

          const percentComplete = parseInt(percentField?.value || '0');

          const processedTask = {
            id: task.id,
            name: task.name,
            status: task.status?.status || 'to do',
            percentComplete,
            phase: phaseValue,
            phaseName: PHASE_MAPPING[phaseValue]?.name || `Phase ${phaseValue}`,
            dependencies: [], // Will be populated if needed
            url: task.url,
            creator: task.creator,
            watchers: task.watchers || [],
            dueDate: task.due_date,
            startDate: task.start_date,
            // 📅 Enhanced timeline data
            dueDateFormatted: task.due_date ? new Date(parseInt(task.due_date)).toDateString() : null,
            startDateFormatted: task.start_date ? new Date(parseInt(task.start_date)).toDateString() : null,
            timeEstimate: task.time_estimate, // milliseconds
            timeEstimateDays: task.time_estimate ? Math.ceil(task.time_estimate / (1000 * 60 * 60 * 24)) : null
          };

          allTasks.push(processedTask);

          if (!phaseGroups[phaseValue]) {
            phaseGroups[phaseValue] = {
              phase: phaseValue,
              name: PHASE_MAPPING[phaseValue]?.name || `Phase ${phaseValue}`,
              color: PHASE_MAPPING[phaseValue]?.color || '#666666',
              emoji: PHASE_MAPPING[phaseValue]?.emoji || '📋',
              tasks: [],
              totalTasks: 0,
              completedTasks: 0,
              averageCompletion: 0
            };
          }

          phaseGroups[phaseValue].tasks.push(processedTask);
        });

        // Calculate phase statistics
        Object.values(phaseGroups).forEach(phase => {
          phase.totalTasks = phase.tasks.length;
          phase.completedTasks = phase.tasks.filter(t => t.percentComplete === 100).length;
          const totalCompletion = phase.tasks.reduce((sum, t) => sum + t.percentComplete, 0);
          phase.averageCompletion = Math.round(totalCompletion / phase.totalTasks);
        });
      }

      // 📅 Calculate overall project timeline
      const projectTimeline = calculateProjectTimeline(allTasks);

      const processedData = {
        projectDetails,
        phases: Object.values(phaseGroups).sort((a, b) => a.phase - b.phase),
        allTasks,
        customFields,
        // 📅 Add timeline information
        timeline: projectTimeline,
        summary: {
          totalPhases: Object.keys(phaseGroups).length,
          totalTasks: allTasks.length,
          overallCompletion: allTasks.length > 0 ? 
            Math.round(allTasks.reduce((sum, t) => sum + t.percentComplete, 0) / allTasks.length) : 0,
          // 📅 Timeline summary
          projectStartDate: projectTimeline.startDate,
          projectEndDate: projectTimeline.endDate,
          projectDuration: projectTimeline.duration,
          timelineType: projectTimeline.timelineType
        }
      };

      console.log('✅ Project Data Processing Complete:');
      console.log(`  • Project: ${projectDetails.name}`);
      console.log(`  • ${processedData.summary.totalPhases} phases`);
      console.log(`  • ${processedData.summary.totalTasks} tasks`);
      console.log(`  • ${processedData.summary.overallCompletion}% overall completion`);

      processedData.phases.forEach(phase => {
        console.log(`  • ${phase.emoji} ${phase.name}: ${phase.totalTasks} tasks, ${phase.averageCompletion}% complete`);
      });

      return processedData;

    } catch (error) {
      console.error('❌ Error processing project data:', error);
      throw error;
    }
  },

  // 🧪 Test Connection
  async testConnection() {
    console.log('🧪 Testing ClickUp API connection...');
    
    try {
      const teams = await this.getTeams();
      
      if (teams.teams && teams.teams.length > 0) {
        console.log('✅ ClickUp API connection successful!');
        console.log(`📊 Connected to ${teams.teams.length} team(s)`);
        return { success: true, teams: teams.teams };
      } else {
        console.warn('⚠️ Connected but no teams found');
        return { success: true, teams: [] };
      }
      
    } catch (error) {
      console.error('❌ ClickUp API connection failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export constants for use in components
export { KNOWN_IDS, PHASE_MAPPING, calculateProjectTimeline, calculatePhaseTimeline };

console.log('📦 ClickUp API Service initialized');
console.log('🔑 API Token status:', API_TOKEN ? '✅ Loaded' : '❌ Missing');
console.log('📋 Known Template List ID:', KNOWN_IDS.franchiseTemplateListId); 