
//FOR TESTING PURPOSES AND DOESNT EXIST IN API LIST
import express from 'express';
import { DevicesController} from '../controllers/devicesController.js';

const router = express.Router();

router.get('/getAllDevices', DevicesController.getAll);
router.get('/getDeviceById/:id', DevicesController.getById);

export default router;
//FOR TESTING PURPOSES AND DOESNT EXIST IN API LIST