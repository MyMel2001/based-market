import { env } from '../config/env';

export interface FeeCalculation {
  totalAmount: number;
  marketplaceFee: number;
  sellerAmount: number;
  feeRate: number;
  instanceOwnerAddress: string;
}

export interface PaymentDestination {
  address: string;
  amount: string;
  purpose: 'marketplace_fee' | 'seller_payment';
}

class FeesService {
  private feeRate: number;
  private instanceOwnerAddress: string;

  constructor() {
    this.feeRate = env.MARKETPLACE_FEE_RATE;
    this.instanceOwnerAddress = env.INSTANCE_OWNER_MONERO_ADDRESS;
  }

  /**
   * Calculate marketplace fee breakdown for a transaction
   */
  calculateFees(totalAmount: number): FeeCalculation {
    if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    const marketplaceFee = totalAmount * this.feeRate;
    const sellerAmount = totalAmount - marketplaceFee;

    return {
      totalAmount,
      marketplaceFee,
      sellerAmount,
      feeRate: this.feeRate,
      instanceOwnerAddress: this.instanceOwnerAddress
    };
  }

  /**
   * Create payment destinations for split payment
   */
  createPaymentDestinations(
    sellerAddress: string, 
    feeCalculation: FeeCalculation
  ): PaymentDestination[] {
    const destinations: PaymentDestination[] = [];

    // Add seller payment
    if (feeCalculation.sellerAmount > 0) {
      destinations.push({
        address: sellerAddress,
        amount: feeCalculation.sellerAmount.toFixed(12), // Monero precision
        purpose: 'seller_payment'
      });
    }

    // Add marketplace fee payment
    if (feeCalculation.marketplaceFee > 0 && this.instanceOwnerAddress) {
      destinations.push({
        address: this.instanceOwnerAddress,
        amount: feeCalculation.marketplaceFee.toFixed(12), // Monero precision
        purpose: 'marketplace_fee'
      });
    }

    return destinations;
  }

  /**
   * Validate fee configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.feeRate < 0 || this.feeRate > 1) {
      errors.push('Marketplace fee rate must be between 0 and 1 (0% to 100%)');
    }

    if (!this.instanceOwnerAddress) {
      errors.push('Instance owner Monero address must be configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get fee information for display
   */
  getFeeInfo() {
    return {
      feeRate: this.feeRate,
      feePercentage: (this.feeRate * 100).toFixed(1) + '%',
      instanceOwnerAddress: this.instanceOwnerAddress,
      description: `Marketplace fee: ${(this.feeRate * 100).toFixed(1)}% goes to instance owner for hosting and maintenance`
    };
  }

  /**
   * Calculate fees for ActivityPub federation context
   */
  createActivityPubFeeContext(feeCalculation: FeeCalculation) {
    return {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        {
          'basedmarket': 'https://basedmarket.org/ns#',
          'marketplaceFee': 'basedmarket:marketplaceFee',
          'sellerAmount': 'basedmarket:sellerAmount',
          'feeRate': 'basedmarket:feeRate',
          'instanceOwner': 'basedmarket:instanceOwner'
        }
      ],
      marketplaceFee: feeCalculation.marketplaceFee,
      sellerAmount: feeCalculation.sellerAmount,
      feeRate: feeCalculation.feeRate,
      instanceOwner: feeCalculation.instanceOwnerAddress
    };
  }
}

export const feesService = new FeesService(); 