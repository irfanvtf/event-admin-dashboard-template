import React from 'react';
import { Search } from 'lucide-react';

interface SurveyResponseSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SurveyResponseSearch: React.FC<SurveyResponseSearchProps> = ({
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-secondary-400" />
      </div>
      <input
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="form-input pl-10 py-2 w-full md:w-64 bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
      />
    </div>
  );
};

export default SurveyResponseSearch;
