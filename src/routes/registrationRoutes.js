import express from 'express';
import { RegistrationController } from '../controllers/registrationController.js';

const router = express.Router();

router.post('/start', RegistrationController.addBusinessEntity);

export default router;
