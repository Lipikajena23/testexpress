import express from 'express';
import devicesRoutes from './devicesRoutes.js';
import loginRoutes from './loginRoutes.js';
import cartOrderRoutes from './cartOrderRoutes.js';
import registeringRoutes from './registrationRoutes.js';
import homeDataRoutes from './restaurant_data_routes.js';
import loginwebRoutes from './loginwebRoutes.js';
import businessEntityRoutes from './businessEntityRoutes.js'
import reportsRoutes from './reportsRoutes.js'
import retailRoutes from './retailRoutes.js';
import cookieParser from 'cookie-parser';
import hrRoutes from './hrRoutes.js';
import session from 'express-session';
import cors from 'cors';

const router = express.Router();
router.use(cors());
router.use(cookieParser())
router.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized:false,
  cookie:{
    secure: false,
    maxAge: 1000 * 60 * 60 *24,
  }
}))

router.use('/devices', devicesRoutes);
router.use('/login', loginRoutes);
router.use('/loginweb',loginwebRoutes);
router.use('/cartOrders', cartOrderRoutes);
router.use('/registration', registeringRoutes);
router.use('/home',homeDataRoutes);
router.use('/businessEntities',businessEntityRoutes);
router.use('/reports',reportsRoutes);
router.use('/retail',retailRoutes);
router.use('/hr',hrRoutes);

export default router;


// "start": "nodemon --experimental-specifier-resolution=node src/server.js",