import React from 'react';

interface FeeBreakdownProps {
  totalAmount: number;
  marketplaceFee: number;
  sellerAmount: number;
  feePercentage: string;
  className?: string;
}

const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  totalAmount,
  marketplaceFee,
  sellerAmount,
  feePercentage,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        💰 Payment Breakdown
      </h3>
      
      <div className="space-y-2">
        {/* Total Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">You pay:</span>
          <span className="text-sm font-medium text-gray-900">
            {totalAmount.toFixed(8)} XMR
          </span>
        </div>
        
        {/* Seller Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Developer receives:</span>
          <span className="text-sm font-medium text-green-600">
            {sellerAmount.toFixed(8)} XMR
          </span>
        </div>
        
        {/* Marketplace Fee */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Marketplace fee ({feePercentage}):
          </span>
          <span className="text-sm font-medium text-blue-600">
            {marketplaceFee.toFixed(8)} XMR
          </span>
        </div>
        
        <hr className="border-gray-200" />
        
        {/* Fee Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 text-lg">ℹ️</span>
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">
                Why do we charge a {feePercentage} fee?
              </p>
              <p>
                This fee supports instance hosting, development, and maintenance of the 
                decentralized marketplace infrastructure that enables ActivityPub federation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeBreakdown; 