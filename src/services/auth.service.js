import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import logger from '../config/logger.js';
import { db } from '../config/database.js';
import { users } from '../models/user.model.js';

const SALT_ROUNDS = 10;

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Error hashing the password', { error });
    throw new Error('Error hashing password');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: passwordHash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
      });

    logger.info(`User ${newUser.email} created successfully`);

    return newUser;
  } catch (error) {
    logger.error('Error creating the user', { error });
    throw error;
  }
};
