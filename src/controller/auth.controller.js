import logger from '../config/logger.js';
import { signupSchema, signInSchema } from '../validations/auth.validation.js';
import { formatValidationError } from '../utils/format.js';
import { createUser } from '../services/auth.service.js';
import { jwttoken } from '../utils/jwt.js';
import { cookies } from '../utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, password, role } = validationResult.data;

    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      message: 'User registered',
      user,
    });
  } catch (error) {
    if (error?.message === 'User already exists') {
      logger.warn(`Attempt to register existing user: ${req.body?.email}`);
      return res.status(409).json({
        error: 'User already exists',
      });
    }

    logger.error('Failed to register user', error);
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email } = validationResult.data;

    // TODO: replace with actual authentication logic and remove mock response
    logger.info(`User signed in: ${email}`);

    res.status(200).json({
      message: 'User signed in',
      user: {
        id: 1,
        email,
      },
    });
  } catch (error) {
    logger.error('Failed to sign in user', error);
    next(error);
  }
};
