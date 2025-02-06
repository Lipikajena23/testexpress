import express from 'express';
import {RestaurantDataController} from '../controllers/poshomepagecontroller.js';

const router = express.Router();

router.post('/posHomeData',RestaurantDataController.getRestaurantData);
router.post('/posTables',RestaurantDataController.getRestaurantTables);
router.post('/getTakeAway',RestaurantDataController.getTakeAwayOrders);
router.post('/getInventory',RestaurantDataController.getInventory);
router.post('/isDayClosed',RestaurantDataController.isDayClosed);
router.post('/openDay',RestaurantDataController.openDay);
router.post('/closeDay',RestaurantDataController.closeDay);
router.post('/insert_order_details',RestaurantDataController.insertOrderDetails);
router.post('/place_new_order',RestaurantDataController.insertNewOrder);
router.post('/settle_order',RestaurantDataController.settleOrder);
router.post('/switch_table',RestaurantDataController.switchTable);
router.post('/removeKOT',RestaurantDataController.updateKOT);

export default router;
