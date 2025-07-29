import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface FeeInfo {
  feePercentage: string;
  description: string;
  isConfigured: boolean;
  configurationErrors: string[];
}

const FeeInfoBanner: React.FC = () => {
  const [feeInfo, setFeeInfo] = useState<FeeInfo | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeeInfo = async () => {
      try {
        const response = await api.get('/fees/info');
        if (response.data.success) {
          setFeeInfo(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch fee info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeInfo();
  }, []);

  if (loading || !feeInfo || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('fee-banner-dismissed', 'true');
  };

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('fee-banner-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 text-lg"
        aria-label="Dismiss"
      >
        ×
      </button>
      
      <div className="flex items-start space-x-3">
        <div className="text-blue-500 text-2xl">🏪</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Marketplace Fee Information
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            {feeInfo.description}
          </p>
          
          {!feeInfo.isConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
              <p className="text-xs text-yellow-700 font-medium mb-1">
                ⚠️ Configuration Issues:
              </p>
              <ul className="text-xs text-yellow-700 list-disc list-inside">
                {feeInfo.configurationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-blue-600">Fee Rate:</span>
              <span className="text-xs font-medium text-blue-800">
                {feeInfo.feePercentage}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-blue-600">Purpose:</span>
              <span className="text-xs text-blue-700">
                Instance hosting & development
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeInfoBanner; 