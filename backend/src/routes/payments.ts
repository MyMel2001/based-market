import { Router } from 'express';
import { z } from 'zod';
import prisma from '@/config/database';
import { authenticate, AuthRequest } from '@/middleware/auth';
import { moneroService } from '@/services/monero';

const router = Router();

const createPaymentSchema = z.object({
  productId: z.string(),
});

// Backward compatibility
const createGamePaymentSchema = z.object({
  gameId: z.string(),
});

const verifyPaymentSchema = z.object({
  transactionId: z.string(),
  txHash: z.string(),
});

// Create payment intent (for paid products)
router.post('/create', authenticate, async (req: AuthRequest, res) => {
  try {
    // Handle backward compatibility for gameId
    let productId;
    if (req.body.gameId && !req.body.productId) {
      const gameData = createGamePaymentSchema.parse(req.body);
      productId = gameData.gameId;
    } else {
      const data = createPaymentSchema.parse(req.body);
      productId = data.productId;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { developer: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: `${product.type === 'GAME' ? 'Game' : 'App'} is not available`,
      });
    }

    if (product.price === 0) {
      return res.status(400).json({
        success: false,
        error: `This is a free ${product.type.toLowerCase()}, no payment required`,
      });
    }

    // Check if user already owns this product
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        productId: productId,
        buyerId: req.user!.id,
        status: 'COMPLETED',
      },
    });

    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        error: `You already own this ${product.type.toLowerCase()}`,
      });
    }

    // Create payment address for this transaction
    const paymentAddress = await moneroService.createSubaddress(
      0,
      `Payment for ${product.title} by ${req.user!.username}`
    );

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        productId: productId,
        buyerId: req.user!.id,
        sellerId: product.developerId,
        amount: product.price,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        transaction,
        paymentAddress: paymentAddress.address,
        amount: product.price,
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          type: product.type,
        },
        // Backward compatibility
        game: {
          id: product.id,
          title: product.title,
          price: product.price,
        },
      },
      message: 'Payment created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Verify payment
router.post('/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = verifyPaymentSchema.parse(req.body);

    const transaction = await prisma.transaction.findUnique({
      where: { id: data.transactionId },
      include: { game: true },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    if (transaction.buyerId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only verify your own transactions',
      });
    }

    if (transaction.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Transaction already completed',
      });
    }

    // For now, we'll mark the transaction as completed
    // In a real implementation, you would verify the payment with the Monero network
    const updatedTransaction = await prisma.transaction.update({
      where: { id: data.transactionId },
      data: {
        status: 'COMPLETED',
        moneroTxHash: data.txHash,
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Increment download count
    await prisma.product.update({
      where: { id: transaction.productId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    res.json({
      success: true,
      data: updatedTransaction,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get user's transactions
router.get('/my-transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { buyerId: req.user!.id },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              productUrl: true,
              type: true,
            },
          },
          seller: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where: { buyerId: req.user!.id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Free download (for free products)
router.post('/free-download', authenticate, async (req: AuthRequest, res) => {
  try {
    // Handle backward compatibility for gameId
    let productId;
    if (req.body.gameId && !req.body.productId) {
      const gameData = createGamePaymentSchema.parse(req.body);
      productId = gameData.gameId;
    } else {
      const data = createPaymentSchema.parse(req.body);
      productId = data.productId;
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { developer: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: `${product.type === 'GAME' ? 'Game' : 'App'} is not available`,
      });
    }

    if (product.price > 0) {
      return res.status(400).json({
        success: false,
        error: `This is a paid ${product.type.toLowerCase()}, payment required`,
      });
    }

    // Create free transaction record
    const transaction = await prisma.transaction.create({
      data: {
        productId: productId,
        buyerId: req.user!.id,
        sellerId: product.developerId,
        amount: 0,
        status: 'COMPLETED',
      },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // Increment download count
    await prisma.product.update({
      where: { id: productId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: transaction,
      message: `Free ${product.type.toLowerCase()} download started`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Free download error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router; 