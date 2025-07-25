import { Router } from 'express';
import { z } from 'zod';
import prisma from '@/config/database';
import { authenticate, requireRole, AuthRequest } from '@/middleware/auth';

const router = Router();

const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  productUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).max(10),
  type: z.enum(['GAME', 'APP']),
});

const updateProductSchema = createProductSchema.partial();

// Backward compatibility
const createGameSchema = createProductSchema.extend({
  gameUrl: z.string().url(),
}).omit({ productUrl: true });

const updateGameSchema = createGameSchema.partial();

// Get all products with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
    const search = req.query.search as string;
    const category = req.query.category as string;
    const type = req.query.type as string;
    const priceMin = parseFloat(req.query.priceMin as string);
    const priceMax = parseFloat(req.query.priceMax as string);
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { developer: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (type && (type === 'GAME' || type === 'APP')) {
      where.type = type;
    }

    if (!isNaN(priceMin) || !isNaN(priceMax)) {
      where.price = {};
      if (!isNaN(priceMin)) where.price.gte = priceMin;
      if (!isNaN(priceMax)) where.price.lte = priceMax;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          developer: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        developer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Create new product (developers only)
router.post('/', authenticate, requireRole(['DEVELOPER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    // Handle backward compatibility for gameUrl
    let data;
    if (req.body.gameUrl && !req.body.productUrl) {
      data = createGameSchema.parse(req.body);
      data = { ...data, productUrl: data.gameUrl, type: 'GAME' };
      delete data.gameUrl;
    } else {
      data = createProductSchema.parse(req.body);
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        developerId: req.user!.id,
      },
      include: {
        developer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: `${product.type === 'GAME' ? 'Game' : 'App'} created successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Update product (owner or admin only)
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    // Handle backward compatibility for gameUrl
    let data;
    if (req.body.gameUrl && !req.body.productUrl) {
      data = updateGameSchema.parse(req.body);
      data = { ...data, productUrl: data.gameUrl };
      delete data.gameUrl;
    } else {
      data = updateProductSchema.parse(req.body);
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if user is owner or admin
    if (existingProduct.developerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own products',
      });
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: {
        developer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: product,
      message: `${product.type === 'GAME' ? 'Game' : 'App'} updated successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Delete product (owner or admin only)
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if user is owner or admin
    if (existingProduct.developerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own products',
      });
    }

    await prisma.product.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: `${existingProduct.type === 'GAME' ? 'Game' : 'App'} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Get my products (developer)
router.get('/my/products', authenticate, requireRole(['DEVELOPER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { developerId: req.user!.id },
        include: {
          developer: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where: { developerId: req.user!.id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Backward compatibility endpoint
router.get('/my/games', authenticate, requireRole(['DEVELOPER', 'ADMIN']), async (req: AuthRequest, res) => {
  // Redirect to the new endpoint
  req.url = '/my/products';
  return router.handle(req, res);
});

export default router; 