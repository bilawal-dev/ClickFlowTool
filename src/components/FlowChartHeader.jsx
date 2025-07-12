import React from 'react';
import { Settings, Hand, RotateCcw, CheckCircle, XCircle, FolderOpen, Folder, Save, Link, TestTube, X, MapPin, Edit, Check, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Layers, LayoutGrid, ChevronDown, Zap, HelpCircle, MousePointer, Move, Trash2, Square, Calendar, User, Search, Menu, Home, BarChart3, FileText, Briefcase, Loader2 } from 'lucide-react';
import { clickupApi } from '../services/clickupApi';

const FlowChartHeader = ({
  // State props
  activeHeaderDropdown,
  setActiveHeaderDropdown,
  showAllTasks,
  toggleAllTasks,
  showHandles,
  setShowHandles,
  calendarOpacity,
  setCalendarOpacity,
  selectedProject,
  projects,
  isLoadingProjects,
  showProjectDropdown,
  setShowProjectDropdown,
  isInitializing,
  isLoadingClickupData,
  clickupData,
  searchTerm,
  setSearchTerm,
  expandedFolders,
  setExpandedFolders,
  
  // Function props
  resetView,
  focusLevel,
  saveCurrentLayoutAsDefault,
  getStorageKey,
  setNodes,
  getVisibleNodes,
  setNodeHandleConfigs,
  setEdges,
  getVisibleEdges,
  setNodeLabels,
  handleProjectSelect,
  toggleFolder,
  getFilteredProjects
}) => {
  return (
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
  );
};

export default FlowChartHeader;