import express from 'express';
import {CartOrderController} from '../controllers/cartOrderController.js';

const router = express.Router();

router.get('/getAllRestaurantTables/:rId', CartOrderController.getRestaurantTables);
router.get('/addNewOrder/:uId/:tableId/:waiterId/:rId/:itemId/:itemQuantity/:itemPrice/:orderId', CartOrderController.addOrder);
router.post('/getTableOrders', CartOrderController.getTableOrders);

export default router;
