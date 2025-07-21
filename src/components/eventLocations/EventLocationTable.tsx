import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  Info,
  RefreshCw,
  Trash2,
  FileDown,
  Edit,
} from "lucide-react";
import {
  EventLocation,
  EventLocationSortConfig,
  EventLocationFilterConfig,
} from "../../types";
import {
  getEventLocations,
  searchAndSortEventLocations,
  deleteEventLocation,
  updateEventLocation,
  exportToCSV,
  getStatusColor,
} from "../../services/eventLocationService";
import EventLocationSearch from "./EventLocationSearch";
import EventLocationEditModal from "./EventLocationEditModal";

const EventLocationTable: React.FC = () => {
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<EventLocation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] =
    useState<EventLocation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<EventLocation | null>(
    null
  );

  const [sortConfig, setSortConfig] = useState<EventLocationSortConfig>({
    key: "pos",
    direction: "asc",
  });

  const [filterConfig, setFilterConfig] = useState<EventLocationFilterConfig>({
    search: "",
    status: undefined,
  });

  useEffect(() => {
    fetchEventLocations();
  }, []);

  // Make sure the initial sort is applied
  useEffect(() => {
    if (eventLocations.length > 0 && sortConfig.key === "pos") {
      const sorted = searchAndSortEventLocations(
        eventLocations,
        filterConfig,
        sortConfig
      );
      setFilteredLocations(sorted);
    }
  }, [eventLocations]);

  useEffect(() => {
    if (eventLocations.length > 0) {
      const sorted = searchAndSortEventLocations(
        eventLocations,
        filterConfig,
        sortConfig
      );
      setFilteredLocations(sorted);
    }
  }, [eventLocations, sortConfig, filterConfig]);

  const fetchEventLocations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getEventLocations();
      setEventLocations(data);
      setFilteredLocations(
        searchAndSortEventLocations(data, filterConfig, sortConfig)
      );
    } catch (err) {
      setError("Failed to load event location data. Please try again.");
      console.error("Error fetching event locations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (location: EventLocation) => {
    setLocationToDelete(location);
    setShowDeleteModal(true);
  };

  const handleEditClick = (location: EventLocation) => {
    setLocationToEdit(location);
    setShowEditModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    try {
      await deleteEventLocation(locationToDelete.id);
      setEventLocations(
        eventLocations.filter((c) => c.id !== locationToDelete.id)
      );
      setShowDeleteModal(false);
      setLocationToDelete(null);
    } catch (err) {
      setError("Failed to delete event location. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setLocationToDelete(null);
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setLocationToEdit(null);
  };

  const handleEditSave = async (updatedLocation: EventLocation) => {
    try {
      await updateEventLocation(updatedLocation.id, {
        location: updatedLocation.location,
        date: updatedLocation.date,
        time: updatedLocation.time,
        venue: updatedLocation.venue,
        status: updatedLocation.status,
        pos: updatedLocation.pos,
        maxCapacity: updatedLocation.maxCapacity,
      });

      // Update the local state
      setEventLocations((prev) =>
        prev.map((loc) =>
          loc.id === updatedLocation.id ? updatedLocation : loc
        )
      );

      // Refresh the data
      fetchEventLocations();
    } catch (error) {
      console.error("Error saving event location:", error);
      throw error;
    }
  };

  const handleSort = (key: keyof EventLocation) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof EventLocation) => {
    if (sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const handleSearch = (term: string) => {
    setFilterConfig({ ...filterConfig, search: term });
  };

  const handleStatusChange = (status: string | undefined) => {
    setFilterConfig({
      ...filterConfig,
      status: status as EventLocation["status"] | undefined,
    });
  };

  const handleExport = () => {
    exportToCSV(filteredLocations);
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-danger-50 text-danger-700 p-4 rounded-lg inline-block">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchEventLocations}
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
            <EventLocationSearch
              searchTerm={filterConfig.search}
              setSearchTerm={handleSearch}
              selectedStatus={filterConfig.status}
              setSelectedStatus={handleStatusChange}
            />

            <div className="flex items-center gap-2">
              <div className="text-sm text-secondary-600">
                Total Locations:{" "}
                <span className="font-semibold">{eventLocations.length}</span>
                {(filterConfig.search || filterConfig.status) && (
                  <span className="ml-2">
                    (Filtered:{" "}
                    <span className="font-semibold">
                      {filteredLocations.length}
                    </span>
                    )
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={filteredLocations.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>

            <button
              onClick={fetchEventLocations}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
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
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-16">
                <Info className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900">
                  No event locations found
                </h3>
                <p className="text-secondary-500 mt-1">
                  {filterConfig.search || filterConfig.status
                    ? "No results match your search criteria"
                    : "There are no event locations in the system yet."}
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      className="w-12 text-center cursor-pointer"
                      onClick={() => handleSort("pos")}
                    >
                      <div className="flex items-center justify-center">
                        #{getSortIcon("pos")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("location")}
                    >
                      <div className="flex items-center">
                        Location
                        {getSortIcon("location")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon("date")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("time")}
                    >
                      <div className="flex items-center">
                        Time
                        {getSortIcon("time")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("venue")}
                    >
                      <div className="flex items-center">
                        Venue
                        {getSortIcon("venue")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th className="w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((location) => (
                    <tr key={location.id}>
                      <td className="text-center">{location.pos || "-"}</td>
                      <td>{location.location}</td>
                      <td>{location.date}</td>
                      <td>{location.time}</td>
                      <td>{location.venue}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            location.status
                          )}`}
                        >
                          {location.status.charAt(0).toUpperCase() +
                            location.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditClick(location)}
                            className="p-1 text-primary-500 hover:text-primary-700 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(location)}
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
            <h3 className="text-lg font-medium text-secondary-900">
              Confirm Delete
            </h3>
            <p className="mt-2 text-secondary-600">
              Are you sure you want to delete the event location "
              {locationToDelete?.location}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EventLocationEditModal
          eventLocation={locationToEdit}
          onClose={handleEditCancel}
          onSave={handleEditSave}
        />
      )}
    </>
  );
};

export default EventLocationTable;
