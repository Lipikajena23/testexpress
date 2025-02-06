import { BusinessRepository } from '../objects/businessRepository.js';

class CartOrderController {

  static async getRestaurantTables(req, res) {
    try {
      const { rId } = req.params;

      if (!rId) {
        throw new Error('Restaurant ID is required to proceed!');
      }

      const allTables = await BusinessRepository.getSeat(rId);

      res.json(allTables);
    } catch (error) {
      console.error('Error in getRestaurantTables:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


  static async addOrder(req, res) {
    try {
      const {
        uId,
        tableId,
        waiterId,
        rId,
        itemId,
        itemQuantity,
        itemPrice,
        orderId,
      } = req.params;

      const itemList = itemId.split(',');
      const quantityList = itemQuantity.split(',');
      const priceList = itemPrice.split(',');

      if (orderId === '-') {
        const newOrderId = await BusinessRepository.addOrder(uId, tableId, waiterId, rId);
        let orderDetailId = 0;
        console.log(newOrderId);
        for (let i = 0; i < itemList.length; i++) {
          orderDetailId = await BusinessRepository.addOrderDetails(
            newOrderId,
            itemList[i],
            quantityList[i],
            priceList[i],
            rId,
            orderDetailId,
            tableId
          );
        }

        res.json({ orderId: newOrderId });
      } else {
        res.json({ orderId: 0 });
      }
    } catch (error) {
      console.error('Error in addOrder:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }

  };

  static async getTableOrders(req, res) {
    try {
      const { rId, tId } = req.body;

      const orders = await BusinessRepository.getTableOrders(rId, tId);
      res.json(orders);
    } catch (error) {
      console.error('Error in getTableOrders:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
}

export { CartOrderController };
