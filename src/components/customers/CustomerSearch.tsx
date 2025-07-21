import React from "react";
import { Search, X } from "lucide-react";
import { locationOptions } from "../../types";

interface CustomerSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedLocation: string | undefined;
  setSelectedLocation: (term: string | undefined) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  searchTerm,
  setSearchTerm,
  selectedLocation,
  setSelectedLocation,
}) => {
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative w-full md:w-64">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-secondary-400" />
        </div>
        <input
          type="text"
          className="input pl-10 pr-10 w-full"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
            onClick={handleClearSearch}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div>
        <select
          value={selectedLocation || ""}
          onChange={(e) =>
            setSelectedLocation(
              e.target.value === "" ? undefined : e.target.value
            )
          }
          className="form-select py-2 w-full md:w-40"
        >
          <option value="">All location</option>
          {locationOptions.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CustomerSearch;
