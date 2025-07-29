import { Router } from 'express';
import { feesService } from '@/services/fees';
import { authenticate, AuthRequest } from '@/middleware/auth';

const router = Router();

// Get marketplace fee information (public)
router.get('/info', async (req, res) => {
  try {
    const feeInfo = feesService.getFeeInfo();
    const validation = feesService.validateConfiguration();
    
    res.json({
      success: true,
      data: {
        ...feeInfo,
        isConfigured: validation.isValid,
        configurationErrors: validation.errors
      },
      message: 'Fee information retrieved successfully'
    });
  } catch (error) {
    console.error('Get fee info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get fee information'
    });
  }
});

// Calculate fees for a given amount (authenticated)
router.post('/calculate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }
    
    const feeCalculation = feesService.calculateFees(parseFloat(amount));
    
    res.json({
      success: true,
      data: {
        ...feeCalculation,
        feePercentage: (feeCalculation.feeRate * 100).toFixed(1) + '%',
        breakdown: {
          youPay: feeCalculation.totalAmount,
          sellerReceives: feeCalculation.sellerAmount,
          marketplaceFee: feeCalculation.marketplaceFee,
          feeDescription: `${(feeCalculation.feeRate * 100).toFixed(1)}% marketplace fee supports instance hosting and development`
        }
      },
      message: 'Fee calculation completed'
    });
  } catch (error) {
    console.error('Calculate fees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate fees'
    });
  }
});

// Admin: Update fee configuration (requires admin role)
router.put('/config', authenticate, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    // Note: In a real implementation, you'd update the configuration
    // For now, we'll just return the current config
    const feeInfo = feesService.getFeeInfo();
    
    res.json({
      success: true,
      data: feeInfo,
      message: 'Fee configuration retrieved (update functionality requires environment variable changes)'
    });
  } catch (error) {
    console.error('Update fee config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fee configuration'
    });
  }
});

export default router; 