import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ClearRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customerName: string;
  isLoading: boolean;
}

const ClearRedemptionModal: React.FC<ClearRedemptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customerName,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4 animate-slide-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Clear Gift Redemption Status</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mb-4 flex items-start">
          <AlertTriangle className="h-5 w-5 text-warning-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-warning-800 font-medium mb-1">Warning: This action cannot be undone</p>
            <p className="text-warning-700 text-sm">
              You are about to clear the gift redemption status for <span className="font-semibold">{customerName}</span>. 
              This will remove their 'redeemed' status and timestamp.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-danger flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Clear Redemption'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearRedemptionModal;
