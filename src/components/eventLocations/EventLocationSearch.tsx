import React from 'react';
import { Search } from 'lucide-react';

interface EventLocationSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: string | undefined;
  setSelectedStatus: (status: string | undefined) => void;
}

const EventLocationSearch: React.FC<EventLocationSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-secondary-400" />
        </div>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input pl-10 py-2 w-full md:w-64"
        />
      </div>
      
      <div>
        <select
          value={selectedStatus || ''}
          onChange={(e) => setSelectedStatus(e.target.value === '' ? undefined : e.target.value)}
          className="form-select py-2 w-full md:w-40"
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="available">Available</option>
          <option value="closed">Closed</option>
          <option value="walk-in">Walk-in</option>
        </select>
      </div>
    </div>
  );
};

export default EventLocationSearch;
