import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { authenticate, AuthRequest } from '../middleware/auth';
import { storageService } from '../services/storage';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  role: z.enum(['USER', 'DEVELOPER']),
  moneroAddress: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      storageService.getUserByEmail(data.email),
      storageService.getUserByUsername(data.username)
    ]);

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        error: 'User with this username already exists',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user
    const user = await storageService.createUser({
      email: data.email,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      moneroAddress: data.moneroAddress,
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    // Generate JWT token
    const payload = { id: userResponse.id, email: userResponse.email };
    const secret = env.JWT_SECRET as string;
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN };
    const token = jwt.sign(payload, secret, options);

    res.status(201).json({
      success: true,
      data: { user: userResponse, token },
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await storageService.getUserByEmail(data.email);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password (only for database mode, ActivityPub doesn't store passwords)
    if (env.STORAGE_MODE === 'database' && user.password) {
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email or password',
        });
      }
    } else if (env.STORAGE_MODE === 'activitypub') {
      // In ActivityPub mode, we'd need a different authentication mechanism
      // For now, we'll warn and allow basic auth
      console.warn('ActivityPub mode: Password authentication is limited');
    }

    // Generate JWT token
    const payload = { id: user.id, email: user.email };
    const secret = env.JWT_SECRET as string;
    const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN };
    const token = jwt.sign(payload, secret, options);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: { user: userWithoutPassword, token },
      message: 'Login successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await storageService.getUserById(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router; 