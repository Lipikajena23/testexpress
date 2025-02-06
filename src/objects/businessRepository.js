import db from '../config/db.js';

class BusinessRepository {


  static async getUserByEmail(email) {
    try {
      const query = 'CALL GetUserByEmail(?)';
      const [rows] = await db.promise().execute(query, [email]);
      const dataArr = [];
      for (const row of rows[0]) {
        const {
          Password,
          UserID,
          UserFirstName,
          UserLastName,
          RoleName,
          RestoID,
          Contact,
          Email,
          Address,
          RestaurantName,
        } = row;

        const dataItem = {
          password: Password,
          uId: UserID,
          uFirstName: UserFirstName,
          uLastName: UserLastName,
          role: RoleName,
          restoId: RestoID,
          contact: Contact,
          email: Email,
          address: Address,
          restoName: RestaurantName,
        };

        dataArr.push(dataItem);
      }
      return dataArr;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async getMenuItem(rId) {
    try {
      const query = 'CALL GetMenuItem(?)';
      const [rows] = await db.promise().execute(query, [rId]);
      const dataArr = [];
      for (const row of rows[0]) {
        const {
          MenuItemID,
          MenuItemName,
          Description,
          Price,
          DiscountPercentage,
          menuCategory,
          Path,
          Type,
          ItemQuantity,
          cgst,
          sgst,
        } = row;

        const dataItem = {
          MenuItemId: MenuItemID,
          MenuItemName: MenuItemName,
          Description: Description,
          Price: Price,
          DiscountPercentage: DiscountPercentage,
          CategoryID: menuCategory,
          Path: Path,
          Type: Type,
          Plate: ItemQuantity,
          cgst: cgst,
          sgst: sgst,
        };

        dataArr.push(dataItem);
      }

      return dataArr;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async getMenuCategories(rId) {
    try {
      const query = 'CALL GetMenuCategories(?)';
      const [rows] = await db.promise().execute(query, [rId]);
      const dataArr = [];
      for (const row of rows[0]) {
        const {
          MenuCategoryName,
          Description,
          isActive,
          MenuCategoryId,
        } = row;

        const dataItem = {
          CategoryName: MenuCategoryName,
          Description: Description,
          IsActive: isActive,
          CategoryId: MenuCategoryId,
        };

        dataArr.push(dataItem);
      }

      return dataArr;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async getSeat(rId) {
    try {
      const query = 'CALL GetSeat(?)';
      const [rows] = await db.promise().execute(query, [rId]);
      const dataArr = [];
      for (const row of rows[0]) {
        const {
          ID,
          Status,
          WaiterId,
          label,
          capacity
        } = row;

        const dataItem = {
          TableId: ID,
          Status: Status,
          WaiterId: WaiterId,
          Label: label,
          Capacity: capacity
        };

        dataArr.push(dataItem);
      }

      return dataArr;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async addOrder(uId, tableId, waiterId, rId) {
    console.log(uId, tableId, waiterId, rId);
    try {
      
      const query = 'CALL AddOrder(?,?,?,?)';
      const [rows] = await db.promise().execute(query, [uId, tableId, waiterId, rId]);
      let orderId;
  
      for (const row of rows[0]) {
        const { OrderId } = row;
        orderId = OrderId;
      }

      return orderId;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async addOrderDetails(oId, iId, iQuantity, price, rId, odId, tId) {

    console.log(oId, iId, iQuantity, price, rId, odId, tId);
    try {
      const query = 'CALL AddOrderDetails(?,?,?,?,?,?,?)';
      const [rows] = await db.promise().execute(query, [oId, iId, iQuantity, price, rId, odId, tId]);
      let kotId;

      for (const row of rows[0]) {
        const { KotId } = row;
        kotId = KotId;
      }

      return kotId;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async getTableOrders(rId, tId) {
    try {
      const query = 'CALL GetTableOrders(?, ?)';
      const [rows] = await db.promise().execute(query, [rId, tId]);

      const dataArr = [];
      for (const row of rows[0]) {
        const {
          KotId,
          OrderId,
          MenuItemID,
          DiscountPercentage,
          Price,
          MenuItemName,
          TableNo,
          Quantity,
          cgst,
          sgst,
        } = row;

        const dataItem = {
          KOTId: KotId,
          OrderId: OrderId,
          MenuItemId: MenuItemID,
          DiscountPercentage: DiscountPercentage,
          Price: Price,
          MenuItemName: MenuItemName,
          TableNo: TableNo,
          Quantity: Quantity,
          Cgst: cgst,
          Sgst: sgst,
        };

        dataArr.push(dataItem);
      }

      return dataArr;
    } catch (error) {
      console.error('Error querying MySQL:', error.message);
      throw error;
    }
  }

  static async insertNewRegistration(
    name,
    business_name,
    address,
    email,
    contact,
    basic,
    special,
    lite,
    extralite,
    source,
    business_id,
    agent_id
  ) {
    try {
      const query = 'CALL InsertNewRegistration(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const [rows] = await db.promise().execute(query, [
        name,
        business_name,
        address,
        email,
        contact,
        basic,
        special,
        lite,
        extralite,
        source,
        business_id,
        agent_id
      ]);

      return rows;
    } catch (error) {
      console.error('Error calling InsertNewRegistration stored procedure:', error.message);
      throw error;
    }
  }


}

export { BusinessRepository };
