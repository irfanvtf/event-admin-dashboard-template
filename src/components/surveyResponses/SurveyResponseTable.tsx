import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Info, RefreshCw, Trash2, FileDown, Eye, MapPin } from 'lucide-react';
import { SurveyResponse, EventLocation } from '../../types';
import { 
  getSurveyResponses, 
  searchAndSortSurveyResponses, 
  deleteSurveyResponse, 
  exportToCSV,
  formatRating,
  SurveyResponseSortConfig,
  SurveyResponseFilterConfig
} from '../../services/surveyResponseService';
import { getEventLocations } from '../../services/eventLocationService';
import SurveyResponseSearch from './SurveyResponseSearch';
import SurveyResponseDetail from './SurveyResponseDetail';

const SurveyResponseTable: React.FC = () => {
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<SurveyResponse[]>([]);
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<SurveyResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [responseToView, setResponseToView] = useState<SurveyResponse | null>(null);
  
  const [sortConfig, setSortConfig] = useState<SurveyResponseSortConfig>({
    key: 'submitted',
    direction: 'desc'
  });
  
  const [filterConfig, setFilterConfig] = useState<SurveyResponseFilterConfig>({
    search: '',
    eventLocationId: ''
  });

  useEffect(() => {
    fetchSurveyResponses();
    fetchEventLocations();
  }, []);

  useEffect(() => {
    if (surveyResponses.length > 0) {
      const sorted = searchAndSortSurveyResponses(surveyResponses, filterConfig, sortConfig);
      setFilteredResponses(sorted);
    }
  }, [surveyResponses, sortConfig, filterConfig]);
  
  // Fetch event locations for the filter dropdown and create a mapping for display
  const fetchEventLocations = async () => {
    try {
      const locations = await getEventLocations();
      setEventLocations(locations);
      
      // Create a mapping of location IDs to location names for display in the table
      const locationMapping: Record<string, string> = {};
      locations.forEach(location => {
        locationMapping[location.id] = location.location;
      });
      setLocationMap(locationMapping);
    } catch (error) {
      console.error('Error fetching event locations:', error);
    }
  };

  const fetchSurveyResponses = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSurveyResponses();
      setSurveyResponses(data);
      setFilteredResponses(searchAndSortSurveyResponses(data, filterConfig, sortConfig));
    } catch (err) {
      setError('Failed to load survey response data. Please try again.');
      console.error('Error fetching survey responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = (response: SurveyResponse) => {
    setResponseToView(response);
    setShowDetailModal(true);
  };

  const handleDeleteClick = (response: SurveyResponse) => {
    setResponseToDelete(response);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;
    
    try {
      await deleteSurveyResponse(responseToDelete.id);
      setSurveyResponses(surveyResponses.filter(r => r.id !== responseToDelete.id));
      setShowDeleteModal(false);
      setResponseToDelete(null);
    } catch (err) {
      setError('Failed to delete survey response. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setResponseToDelete(null);
  };

  const handleDetailClose = () => {
    setShowDetailModal(false);
    setResponseToView(null);
  };

  const handleSort = (key: keyof SurveyResponse) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof SurveyResponse) => {
    if (sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const handleSearch = (searchTerm: string) => {
    setFilterConfig({
      ...filterConfig,
      search: searchTerm
    });
  };
  
  const handleLocationFilter = (eventLocationId: string) => {
    setFilterConfig({
      ...filterConfig,
      eventLocationId
    });
  };

  const handleExport = () => {
    exportToCSV(filteredResponses);
  };

  // Format date from timestamp
  const formatDate = (timestamp: any) => {
    try {
      // Check if it's a Firestore timestamp object with seconds and nanoseconds
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        // Convert Firestore timestamp to JavaScript Date
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString();
      }
      
      // Check if it's a string in Firestore timestamp format
      if (timestamp && typeof timestamp === 'string' && timestamp.includes('at')) {
        // Return the formatted string directly as it's already human-readable
        return timestamp;
      }
      
      // For other date formats, try to parse as Date object
      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString();
        }
      }
      
      // If all else fails, return a placeholder
      return 'Date not available';
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date not available';
    }
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-danger-50 text-danger-700 p-4 rounded-lg inline-block">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchSurveyResponses}
            className="mt-4 btn btn-primary inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-slide-up relative z-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <SurveyResponseSearch searchTerm={filterConfig.search} setSearchTerm={handleSearch} />
            
            {/* Location Filter Dropdown */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 text-secondary-400" />
              </div>
              <select
                value={filterConfig.eventLocationId}
                onChange={(e) => handleLocationFilter(e.target.value)}
                className="form-select pl-10 py-2 w-full md:w-64 bg-secondary-50 h-10 border-[2px] border-secondary-200 rounded"
              >
                <option value="">All Locations</option>
                {eventLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.location}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-secondary-600">
                Total Responses: <span className="font-semibold">{surveyResponses.length}</span>
                {(filterConfig.search || filterConfig.eventLocationId) && (
                  <span className="ml-2">
                    (Filtered: <span className="font-semibold">{filteredResponses.length}</span>)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={filteredResponses.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            
            <button
              onClick={fetchSurveyResponses}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="card overflow-hidden">
          <div className="table-container">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-16">
                <Info className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900">No survey responses found</h3>
                <p className="text-secondary-500 mt-1">
                  {filterConfig.search 
                    ? `No results match "${filterConfig.search}"`
                    : "There are no survey responses in the system yet."}
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon('name')}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort('contactNumber')}
                    >
                      <div className="flex items-center">
                        Contact
                        {getSortIcon('contactNumber')}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort('eventLocationId')}
                    >
                      <div className="flex items-center">
                        Location
                        {getSortIcon('eventLocationId')}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort('submitted')}
                    >
                      <div className="flex items-center">
                        Submitted
                        {getSortIcon('submitted')}
                      </div>
                    </th>
                    <th className="w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response, index) => (
                    <tr key={response.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{response.name}</td>
                      <td>{response.email}</td>
                      <td>{response.contactNumber}</td>
                      <td>
                        {locationMap[response.eventLocationId] || 
                          <span className="text-secondary-400 text-xs italic">No location</span>}
                      </td>
                      <td>{formatDate(response.submitted)}</td>
                      <td>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleViewClick(response)}
                            className="p-1 text-primary-500 hover:text-primary-700 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(response)}
                            className="p-1 text-danger-500 hover:text-danger-700 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-medium text-secondary-900">Confirm Delete</h3>
            <p className="mt-2 text-secondary-600">
              Are you sure you want to delete the survey response from "{responseToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && responseToView && (
        <SurveyResponseDetail
          surveyResponse={responseToView}
          onClose={handleDetailClose}
        />
      )}
    </>
  );
};

export default SurveyResponseTable;
