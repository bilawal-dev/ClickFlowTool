# ClickUp API Integration Documentation

## 📋 Project Overview

**ClickUp Flow Tool** is an interactive flowchart application that visualizes franchise project workflows using real data from ClickUp. The tool displays a 3-level hierarchy:

1. **Level 1: CRM Logic Flow** - Business process automation workflow
2. **Level 2: Project Phases** - Real ClickUp project phases with task counts and completion percentages
3. **Level 3: Phase Tasks** - Individual tasks from ClickUp with completion status and visual indicators

## 🎯 Business Logic & Purpose

### Current Implementation (Phase 1)
- **Template-Based Data**: Fetches data from a specific ClickUp template list (`Franchise Project_Template`)
- **Phase Visualization**: Groups 37 real tasks into 6 active phases (0, 6, 7, 8, 9, 10)
- **Progress Tracking**: Shows completion percentages for phases and individual tasks
- **Interactive Flowchart**: Users can expand phases to see underlying tasks, edit nodes, create custom connections

### Future Requirements (Phase 2)
- **Live Project Data**: Connect to actual ClickUp projects instead of templates
- **Real-Time Progress**: Track live project status and completion
- **Multi-Project Support**: Handle multiple franchise projects simultaneously

## 🔐 Authentication & Configuration

### Current Setup
```javascript
// Environment Variable Required
VITE_CLICKUP_PERSONAL_API_TOKEN = "pk_89449315_KNBZN67D3PHZDXTOW6WFT0HTDV6XKMM0"

// API Base URL
BASE_URL = "https://api.clickup.com/api/v2"

// Authentication Headers
{
  "Authorization": API_TOKEN,
  "Content-Type": "application/json"
}
```

### Known System IDs
```javascript
const KNOWN_IDS = {
  teamId: '9013410499',
  templatesSpaceId: '90131823880', 
  franchiseTemplateListId: '901314428250',
  customFields: {
    percentComplete: 'e50bab98-75cd-40c2-a193-ce2811e1713b',
    phase: 'e024c849-5312-44c7-8c28-d3642fc4163a'
  }
};
```

## 🛠️ API Endpoints Called

### 1. Discovery Endpoints (For exploration/debugging)

#### GET `/team`
- **Purpose**: Fetch user's accessible teams
- **Usage**: Connection testing and team discovery
- **Response**: Array of teams with `{id, name}` structure

#### GET `/team/{teamId}/space`
- **Purpose**: Get spaces within a team
- **Usage**: Space discovery and navigation
- **Default Team ID**: `9013410499`

#### GET `/space/{spaceId}/list`
- **Purpose**: Get lists within a space
- **Usage**: List discovery and validation
- **Default Space ID**: `90131823880` (Templates space)

### 2. Core Data Endpoints (Primary business logic)

#### GET `/list/{listId}`
- **Purpose**: Get template list metadata
- **Default List ID**: `901314428250` (Franchise Project_Template)
- **Response Data Used**:
  ```javascript
  {
    name: data.name,
    id: data.id,
    space: data.space?.name,
    taskCount: data.task_count,
    url: data.url
  }
  ```

#### GET `/list/{listId}/task?include_closed=true&include_subtasks=true`
- **Purpose**: Fetch all tasks from template list
- **Critical Endpoint**: This is the primary data source for the flowchart
- **Query Parameters**:
  - `include_closed=true`: Include completed tasks
  - `include_subtasks=true`: Include subtask hierarchy
- **Response**: Array of tasks with full metadata

#### GET `/list/{listId}/field`
- **Purpose**: Get custom field definitions
- **Usage**: Validates custom field structure and options
- **Critical Fields**:
  - `% Complete` field (ID: `e50bab98-75cd-40c2-a193-ce2811e1713b`)
  - `Phase` dropdown (ID: `e024c849-5312-44c7-8c28-d3642fc4163a`)

#### GET `/task/{taskId}/dependency` (Optional)
- **Purpose**: Get task dependencies
- **Usage**: Future feature for dependency visualization
- **Current Status**: Available but not actively used in UI

## 📊 Data Processing & Business Logic

### Phase Mapping System
The system uses a predefined phase mapping that transforms ClickUp phase IDs into business-friendly data:

```javascript
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
```

### Critical Phase ID Mapping
ClickUp stores phases as dropdown option IDs. The system maps these to phase numbers:

```javascript
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
```

### Data Transformation Pipeline

#### 1. Raw Task Processing
```javascript
// For each task from ClickUp API:
const processedTask = {
  id: task.id,
  name: task.name,
  status: task.status?.status || 'to do',
  percentComplete: parseInt(percentField?.value || '0'),
  phase: phaseValue, // Derived from phase ID mapping
  phaseName: PHASE_MAPPING[phaseValue]?.name || 'Unknown Phase',
  dependencies: [], // For future use
  url: task.url,
  creator: task.creator,
  watchers: task.watchers || []
};
```

#### 2. Phase Grouping & Statistics
```javascript
// Group tasks by phase and calculate metrics:
const phaseGroup = {
  phase: phaseValue,
  name: PHASE_MAPPING[phaseValue]?.name,
  color: PHASE_MAPPING[phaseValue]?.color,
  emoji: PHASE_MAPPING[phaseValue]?.emoji,
  tasks: [...tasksInPhase],
  totalTasks: tasks.length,
  completedTasks: tasks.filter(t => t.percentComplete === 100).length,
  averageCompletion: Math.round(totalCompletion / totalTasks)
};
```

#### 3. Final Output Structure
```javascript
const processedData = {
  listDetails: {...}, // Template list metadata
  phases: [...], // Array of phase objects sorted by phase number
  allTasks: [...], // Flattened array of all processed tasks
  customFields: [...], // Custom field definitions
  summary: {
    totalPhases: Object.keys(phaseGroups).length,
    totalTasks: allTasks.length,
    overallCompletion: Math.round(average)
  }
};
```

## 🔄 Data Flow Architecture

### Current Frontend Flow
```
1. App Load → getProcessedTemplateData()
2. Parallel API Calls:
   - getTemplateList() → List metadata
   - getTemplateTasks() → All tasks with custom fields
   - getTemplateCustomFields() → Field definitions
3. Data Processing:
   - Parse phase assignments from custom field values
   - Group tasks by phase using ID mapping
   - Calculate completion statistics
   - Transform to UI-friendly format
4. UI Rendering:
   - Generate phase nodes with task counts
   - Create task nodes with completion colors
   - Build connections between phases and tasks
5. Interactive Features:
   - Click phases to expand/collapse tasks
   - Visual completion indicators
   - Real-time progress display
```

### Proposed Backend Flow
```
1. Backend Service:
   - Fetch ClickUp data on schedule or on-demand
   - Process and cache transformed data
   - Expose REST/GraphQL endpoints
2. Frontend:
   - Fetch processed data from backend API
   - Render flowchart with cached data
   - Handle real-time updates via WebSocket/polling
```

## 📋 Current Data Schema

### Phase Object Structure
```javascript
{
  phase: 0, // Phase number (0-10)
  name: "DUE DILIGENCE/PLANNING", // Human-readable name
  color: "#1bbc9c", // UI color code
  emoji: "📊", // Display emoji
  tasks: [...], // Array of task objects in this phase
  totalTasks: 5, // Count of tasks in phase
  completedTasks: 2, // Count of 100% complete tasks
  averageCompletion: 40 // Average completion percentage
}
```

### Task Object Structure
```javascript
{
  id: "86a9g7vxe", // ClickUp task ID
  name: "Review CRM-Workflow Communications", // Task name
  status: "to do", // Current status
  percentComplete: 0, // 0-100 completion percentage
  phase: 0, // Phase number this task belongs to
  phaseName: "DUE DILIGENCE/PLANNING", // Phase name
  dependencies: [], // Task dependencies (future use)
  url: "https://app.clickup.com/t/86a9g7vxe", // Direct ClickUp link
  creator: {...}, // User who created task
  watchers: [...] // Users watching task
}
```

### API Response Format
```javascript
{
  listDetails: {
    name: "Franchise Project_Template",
    id: "901314428250",
    space: { name: "Templates" },
    taskCount: 37,
    url: "https://app.clickup.com/..."
  },
  phases: [
    { phase: 0, name: "DUE DILIGENCE/PLANNING", ... },
    { phase: 6, name: "PERMITTING", ... },
    // ... more phases
  ],
  allTasks: [
    { id: "86a9g7vxe", name: "Review CRM...", ... },
    // ... all 37 tasks
  ],
  customFields: [
    { id: "e50bab98-75cd-40c2-a193-ce2811e1713b", name: "% Complete", ... },
    // ... field definitions
  ],
  summary: {
    totalPhases: 6,
    totalTasks: 37,
    overallCompletion: 23
  }
}
```

## ⚠️ Error Handling

### Current Implementation
```javascript
// API Call Wrapper
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Authorization': API_TOKEN, ... }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ClickUp API Error: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API Call Failed for ${endpoint}:`, error);
    throw error;
  }
};
```

### Error Scenarios to Handle
1. **Authentication Failures**: Invalid or expired API token
2. **Rate Limiting**: ClickUp API rate limits exceeded
3. **Network Issues**: Connection timeouts, DNS failures
4. **Data Inconsistencies**: Missing custom fields, invalid phase IDs
5. **Permission Issues**: Insufficient access to workspace/lists

## 🚀 Performance Considerations

### Current Limitations
- **Frontend API Calls**: Direct browser-to-ClickUp calls expose API token
- **No Caching**: Fresh API calls on every page load
- **Rate Limiting**: No rate limit protection
- **Large Responses**: Full task data fetched every time

### Recommended Backend Optimizations
1. **Caching Strategy**: Cache processed data for 5-15 minutes
2. **Incremental Updates**: Track task update timestamps
3. **Data Pagination**: Handle large task lists efficiently
4. **Background Processing**: Fetch data on schedule vs on-demand
5. **Response Compression**: Minimize data transfer

## 🔧 Technical Implementation Details

### Environment Configuration
```bash
# Required Environment Variables
CLICKUP_API_TOKEN="pk_89449315_KNBZN67D3PHZDXTOW6WFT0HTDV6XKMM0"
CLICKUP_BASE_URL="https://api.clickup.com/api/v2"

# Known System IDs (hardcoded)
CLICKUP_TEAM_ID="9013410499"
CLICKUP_TEMPLATES_SPACE_ID="90131823880"
CLICKUP_TEMPLATE_LIST_ID="901314428250"
```

### Critical Custom Field IDs
```bash
# These IDs are system-specific and must not change
PERCENT_COMPLETE_FIELD_ID="e50bab98-75cd-40c2-a193-ce2811e1713b"
PHASE_FIELD_ID="e024c849-5312-44c7-8c28-d3642fc4163a"
```

### Dependencies & Technology Stack
```json
{
  "current_frontend": {
    "framework": "React 18.2.0",
    "build_tool": "Vite 4.5.14",
    "ui_library": "@xyflow/react 12.8.1"
  },
  "api_client": "native fetch()",
  "data_processing": "vanilla JavaScript"
}
```

## 🎯 Migration Recommendations

### Phase 1: Backend Implementation
1. **Replicate Current Logic**: Implement exact same data processing pipeline
2. **API Endpoint Design**: Create RESTful endpoints matching current data structure
3. **Error Handling**: Implement robust error handling and logging
4. **Testing**: Ensure output matches current frontend exactly

### Phase 2: Enhanced Features
1. **Real-time Updates**: WebSocket connection for live data
2. **Multiple Projects**: Support actual project data vs templates
3. **User Authentication**: Proper OAuth integration with ClickUp
4. **Performance Monitoring**: Track API usage and response times

### Suggested Backend Endpoints
```
GET /api/template-data
→ Returns processed template data (current getProcessedTemplateData())

GET /api/template-data/phases
→ Returns just phase information with task counts

GET /api/template-data/tasks
→ Returns all tasks with filtering options

GET /api/health/clickup
→ Tests ClickUp API connection (current testConnection())
```

## 📋 Integration Checklist

### ✅ Must Preserve
- [ ] Exact phase mapping (IDs to numbers to names)
- [ ] Task completion percentage calculation
- [ ] Phase statistics (total, completed, average completion)
- [ ] Output data structure (phases, allTasks, summary)
- [ ] Error handling for missing/invalid data

### ✅ Must Implement
- [ ] All current API endpoints with same parameters
- [ ] Custom field parsing logic (phase and % complete)
- [ ] Phase ID to index mapping
- [ ] Task grouping and statistics calculation
- [ ] Comprehensive logging for debugging

### ✅ Nice to Have
- [ ] Response caching
- [ ] Rate limiting protection
- [ ] Incremental data updates
- [ ] API monitoring and alerting
- [ ] Multiple environment support

## 🔍 Testing & Validation

### Current Test Data
- **Template List**: "Franchise Project_Template" (ID: 901314428250)
- **Expected Output**: 6 phases, 37 tasks total
- **Active Phases**: 0, 6, 7, 8, 9, 10
- **Sample Task**: "Review CRM-Workflow Communications" (Phase 0)

### Validation Points
1. **Phase Distribution**: Verify tasks correctly assigned to phases
2. **Completion Calculation**: Ensure percentage math is accurate
3. **Custom Field Parsing**: Test with various field value formats
4. **Error Scenarios**: Test with invalid tokens, missing data
5. **Performance**: Measure API response times and data size

---

## 📞 Questions for Backend Implementation

1. **Data Storage**: Should processed data be cached in database or memory?
2. **Update Frequency**: How often should we refresh ClickUp data?
3. **Authentication**: Should we implement ClickUp OAuth or continue with API tokens?
4. **Monitoring**: What level of logging and monitoring is needed?
5. **Scaling**: Will this support multiple teams/workspaces in the future?

---

**Last Updated**: January 2025  
**Current Phase**: Template-based data integration (Phase 1)  
**Next Phase**: Live project data integration (Phase 2) 