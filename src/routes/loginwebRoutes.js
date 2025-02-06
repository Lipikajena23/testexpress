import express from 'express';
import {LoginwebController} from '../controllers/loginwebController.js';


const router = express.Router();

router.post('/read', LoginwebController.read);

export default router;
