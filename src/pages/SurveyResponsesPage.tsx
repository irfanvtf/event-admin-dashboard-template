import React from 'react';
import SurveyResponseTable from '../components/surveyResponses/SurveyResponseTable';

const SurveyResponsesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-10">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Survey Responses</h1>
          <p className="text-secondary-600 mt-1">View and manage all survey responses</p>
        </div>
      </div>
      
      <SurveyResponseTable />
    </div>
  );
};

export default SurveyResponsesPage;
