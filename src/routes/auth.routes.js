import express from 'express';
import { signIn, signup } from '../controller/auth.controller.js';
const router = express.Router();

router.post('/sign-up', signup);

router.post('/sign-in', signIn);

router.post('/sign-out', (req, res) => {
  res.send('POST /api/auth/signout response');
});

export default router;
