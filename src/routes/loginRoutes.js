import express from 'express';
import {LoginController} from '../controllers/loginController.js';

const router = express.Router();

router.post('/read', LoginController.read);

export default router;
