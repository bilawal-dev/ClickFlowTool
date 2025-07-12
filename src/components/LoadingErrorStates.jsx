import React from 'react';
import { Loader2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const LoadingErrorStates = ({ 
  isInitializing, 
  isLoadingClickupData, 
  clickupData, 
  onRetry 
}) => {
  // Loading State
  if (isInitializing || isLoadingClickupData) {
    return (
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
    );
  }

  // Error State
  if (!isInitializing && !isLoadingClickupData && !clickupData) {
    return (
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
            onClick={onRetry}
            className="bg-blue-500 hover:bg-blue-600 text-white border-none px-6 py-3 rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2 mx-auto transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw size={16} />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  // No overlay needed
  return null;
};

export default LoadingErrorStates; 