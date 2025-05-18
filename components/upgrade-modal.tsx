import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void; // Placeholder for Stripe/Clerk integration
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-semibold mb-4">Upgrade to Pro!</h2>
        <p className="mb-6">Unlock powerful features by upgrading to our Pro plan:</p>
        <ul className="list-disc list-inside mb-6 space-y-2">
          <li>Support for up to 5 locations in Meet-Me-Halfway.</li>
          <li>Real-time traffic data for more accurate ETAs.</li>
          <li>Advanced analytics and fairness scores (coming soon!).</li>
          <li>Saved searches and favorite locations.</li>
        </ul>
        <div className="text-center mb-6">
          <p className="text-3xl font-bold">$9.99/month</p>
          {/* Or your actual pricing structure */}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal; 