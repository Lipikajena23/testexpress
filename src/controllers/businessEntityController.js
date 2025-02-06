import db from '../config/db.js';
import util from 'util';
import csv from 'csv-parser';
import fs from 'fs';



class BusinessEntityController {
  static async getAllBusinessEntities(req, res) {
    const groupId = req.params.groupId;
    const query = util.promisify(db.query).bind(db);

    try {
      const results = await query('SELECT * FROM business_entity WHERE group_id = ? AND business_type =?', [groupId, 'R']);
      res.json(results);
    } catch (error) {
      console.error('Error querying MySQL:', error);
      console.error('Failed SQL query:', 'SELECT * FROM BusinessEntity');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async addBusinessEntity(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { businessName, Manager, Email, contactNo, Address, Group_ID, GstNumber, ManagerEmail } = req.body;

      const emailExists = await query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [ManagerEmail]);
      if (emailExists[0].count > 0) {
        return res.status(400).json({ error: 'Email is already used' });
      }


      const userInsertResult = await query(
        'INSERT INTO users (first_name, email, password,is_active) VALUES (?, ?, ?,?)',
        [Manager, ManagerEmail, ManagerEmail, 0]
      );

      const userId = userInsertResult.insertId;
      const role = 2;


      const businessInsertResult = await query(
        'INSERT INTO business_entity (business_name, name, email, contact_no, address, group_id, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [businessName, Manager, Email, contactNo, Address, Group_ID, 'R']
      );

      await query(
        'INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role) VALUES (?, ?, ?)',
        [userId, businessInsertResult.insertId, role]
      );

      await query(
        'INSERT INTO restaurants (id, name,gst_no) VALUES (?, ?,?)',
        [businessInsertResult.insertId, businessName, GstNumber]
      );

      return res.status(200).json({ message: 'Business entity and user registered successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async getBusinessEntitybyEmail(req, res) {
    const { email, businesstype } = req.body;

    db.query('SELECT * FROM business_entity WHERE email = ? and business_type= ?', [email, businesstype], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        console.error('Failed SQL query:', 'SELECT * FROM user');
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
        console.log(results)
      }
    });
  }


  static async getTotalAmountByCash(req, res) {
    const { restaurantId, drawerAmount, date } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    if (drawerAmount == null) {
      return res.status(400).json({ error: 'Drawer amount is required' });
    }

    const queryOrders = 'SELECT SUM(grand_total) AS totalCash FROM orders WHERE restaurant_id = ? AND payment_mode = ? AND payment_status = ? AND date = ?';
    const queryInitialDrawer = 'SELECT initial_cash_drawer AS initDrawerCash FROM day_operations WHERE restaurant_id = ? AND date = ?';

    try {
      db.query(queryOrders, [restaurantId, 'Cash', 'Paid', date], (errOrders, resultsOrders) => {
        if (errOrders) {
          console.error('Error querying MySQL (orders):', errOrders);
          return res.status(500).json({ error: 'Internal Server Error' });
        }

        const totalCash = resultsOrders[0]?.totalCash || 0;

        db.query(queryInitialDrawer, [restaurantId, date], (errDrawer, resultsDrawer) => {
          if (errDrawer) {
            console.error('Error querying MySQL (initial drawer):', errDrawer);
            return res.status(500).json({ error: 'Internal Server Error' });
          }

          const initDrawerCash = resultsDrawer[0]?.initDrawerCash || 0;
          const adjustedDrawerAmount = parseFloat(drawerAmount) - initDrawerCash;

          let responseCode;
          if (adjustedDrawerAmount < totalCash) {
            responseCode = 'DR1';
          } else if (adjustedDrawerAmount > totalCash) {
            responseCode = 'DR2';
          } else {
            responseCode = 'DR0';
          }

          res.json({ totalCash, drawerAmount: adjustedDrawerAmount, responseCode });
        });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async getAllRestaurantsAndProducts(req, res) {
    const { groupId } = req.params;
    db.query('SELECT business_name, business_entity_id FROM business_entity WHERE group_id = ? AND business_type = ?', [groupId, 'R'], (err, resu) => {
      if (err) {
        console.error('Error querying MySQL FROM business_entity:', err);
        console.error('Failed SQL query FROM business_entity');
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        db.query('SELECT product_id,product_name FROM products WHERE  business_type IN (? ,? )', ['R','RT'], (err, results) => {
          if (err) {
            console.error('Error querying MySQL FROM products:', err);
            console.error('Failed SQL query FROM products');
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.json({ products: results, restaurants: resu });
          }
        });
      }
    });
  }

  static async addProductForBusinessEntity(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { businessEntityId, productId, groupId } = req.body;
    console.log(req.body);
    const productExists = await query('SELECT COUNT(*) AS count FROM business_entity_product_mapping WHERE  business_entity_id=? AND product_id=? AND is_active=?', [businessEntityId, productId, 1]);
    if (productExists[0].count > 0) {
      return res.status(400).json({ error: 'Product is already registered' });
    } else {
      await query('INSERT INTO business_entity_product_mapping (business_entity_id, product_id,is_active,group_id) VALUES (?,?,?,?)', [businessEntityId, productId, 1, groupId], (err, resu) => {
        if (err) {
          console.error('Error adding product for business:', err);
          console.error('Failed SQL Error adding product for business');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.status(200).json({ success: 'Registered succesfully' })
        }
      });
    }
  }


  static async getAllRestoNProdsViaGroupId(req, res) {
    const { groupId } = req.params;
    db.query(
      'SELECT business_entity_product_mapping.bepm_id,business_entity_product_mapping.is_active,products.product_id,products.product_name, business_entity.business_name,business_entity.business_entity_id ' +
      'FROM business_entity_product_mapping ' +
      'JOIN products ON business_entity_product_mapping.product_id = products.product_id ' +
      'JOIN business_entity ON business_entity_product_mapping.business_entity_id = business_entity.business_entity_id ' +
      'WHERE business_entity_product_mapping.group_id = ?',
      [groupId],
      (err, result) => {
        if (err) {
          console.error('Error querying MySQL FROM business_entity_entity_role_mapping:', err);
          console.error('Failed SQL query FROM business_entity_entity_role_mapping');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const allProdsNRestos = result.map(row => ({
            bepm_id: row.bepm_id,
            productId: row.product_id,
            productName: row.product_name,
            businessEntityId: row.business_entity_id,
            businessName: row.business_name,
            is_active: row.is_active
          }));
          res.status(200).json({ allProdsNRestos });
        }
      }
    );
  }

  static async changeRestoProductStat(req, res) {
    const { flag, bepmId } = req.params;
    db.query(
      'UPDATE `business_entity_product_mapping` SET `is_active`=? WHERE bepm_id=?',
      [flag, bepmId],
      (err, result) => {
        if (err) {
          console.error('Error deactivating/restoring resto product:', err);
          console.error('Failed UPDATE `business_entity_product_mapping`');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const message = flag === '0' ? 'Product deactivated successfully' : 'Product activated successfully';
          const updateStat = {
            bepm_id: bepmId,
            is_active: flag,
            message: message
          };
          res.status(200).json({ updateStat });
        }
      }
    );
  }

  static async unlinkRestoAndProduct(req, res) {
    const { bepmId } = req.params;
    db.query(
      'DELETE FROM `business_entity_product_mapping` WHERE bepm_id=?',
      [bepmId],
      (err, result) => {
        if (err) {
          console.error('Error unlinking resto and product:', err);
          console.error('Failed to unlink in `business_entity_product_mapping`');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const message = 'Restaurant and product unlinked successfully';
          const stat = {
            bepm_id: bepmId,
            message: message
          };
          res.status(200).json({ stat });
        }
      }
    );
  }

  static async updateMenuItem(req, res) {
    const query = util.promisify(db.query).bind(db);
  
    try {
      const {
        menuId,
        menuName,
        cgst,
        sgst,
        price,
        code,
        menu_category_id,
        businessEntityId
      } = req.body;
  
      if (!menuId || !menuName || !cgst || !sgst || !price || !menu_category_id || !businessEntityId) {
        return res.status(400).json({ error: 'All fields are required.' });
      }
  
      const [existingItem] = await query(
        'SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?',
        [menuId, businessEntityId]
      );
  
      if (!existingItem) {
        console.error(`Menu item not found: menuId = ${menuId}, businessEntityId = ${businessEntityId}`);
        return res.status(404).json({ error: 'Menu item not found or does not belong to this restaurant' });
      }
  
      
      const [existingCategory] = await query(
        'SELECT id FROM menu_category WHERE id = ? AND restaurant_id = ?',
        [menu_category_id, businessEntityId]
      );
  
      if (!existingCategory) {
        console.error(`Invalid category: menu_category_id = ${menu_category_id}, businessEntityId = ${businessEntityId}`);
        return res.status(400).json({ error: 'Invalid category for this restaurant' });
      }
      
      const [duplicateCodeItem] = await query(
        'SELECT id FROM menu_items WHERE code = ? AND restaurant_id = ? AND id != ?',
        [code, businessEntityId, menuId]
      );
  
      if (duplicateCodeItem) {
        return res.status(230).json({ error: 'The item code is already used by another menu item !' });
      }
  
      const result = await query(
        `UPDATE menu_items 
             SET name = ?, 
                 cgst = ?, 
                 sgst = ?, 
                 price = ?, 
                 code = ?, 
                 menu_category_id = ?
             WHERE id = ? AND restaurant_id = ?`,
        [menuName, cgst, sgst, price, code, menu_category_id, menuId, businessEntityId]
      );
  
      if (result.affectedRows > 0) {
        return res.status(200).json({
          message: 'Menu item updated successfully',
          updatedItem: {
            menuId,
            menuName,
            cgst,
            sgst,
            code,
            price,
            menu_category_id
          }
        });
      } else {
        console.error(`Failed to update menu item: menuId = ${menuId}, businessEntityId = ${businessEntityId}`);
        return res.status(400).json({ error: 'Failed to update menu item' });
      }
  
    } catch (error) {
      console.error('Error updating menu item:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  


  //delete menu-item
  static async deleteMenuItem(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { menu_id } = req.params;

    if (!menu_id) {
      console.error("Validation Error: Menu ID is required");
      return res.status(400).json({ error: "Menu ID is required" });
    }

    try {
      const deleteQuery = 'DELETE FROM menu_items WHERE id = ?';
      const result = await query(deleteQuery, [menu_id]);

      if (result.affectedRows > 0) {
        return res.status(200).json({ message: "Menu item deleted successfully" });
      } else {
        console.error(`Deletion Error: Menu item not found for menu_id = ${menu_id}`);
        return res.status(404).json({ error: "Menu item not found" });
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return res.status(500).json({ error: "An error occurred while deleting the menu item" });
    }
  }
  static async deleteSection(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { section_id } = req.params;

    if (!section_id) {
      console.error("Validation Error: Section ID is required");
      return res.status(400).json({ error: "Section ID is required" });
    }

    try {
      const deleteQuery = 'DELETE FROM restaurant_sections WHERE id = ?';
      const result = await query(deleteQuery, [section_id]);

      if (result.affectedRows > 0) {
        return res.status(200).json({ message: "Section deleted successfully" });
      } else {
        console.error(`Deletion Error: Section not found for section_id = ${section_id}`);
        return res.status(404).json({ error: "Section not found" });
      }
    } catch (error) {
      console.error('Error deleting section:', error);
      return res.status(500).json({ error: "An error occurred while deleting the section" });
    }
  }

  static async deleteCategory(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { category_id } = req.params;

    if (!category_id) {
      console.error("Validation Error: Category ID is required");
      return res.status(400).json({ error: "Category ID is required" });
    }

    try {
      const deleteQuery = 'DELETE FROM menu_category WHERE id = ?';
      const result = await query(deleteQuery, [category_id]);

      if (result.affectedRows > 0) {
        return res.status(200).json({ message: "Category deleted successfully" });
      } else {
        console.error(`Deletion Error: Category not found for category_id = ${category_id}`);
        return res.status(404).json({ error: "Category not found" });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: "An error occurred while deleting the category" });
    }
  }


  static async deleteTable(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { table_id } = req.params;

    if (!table_id) {
      console.error("Validation Error: Table ID is required");
      return res.status(400).json({ error: "Table ID is required" });
    }

    try {
      const deleteQuery = 'DELETE FROM tables WHERE id = ?';
      const result = await query(deleteQuery, [table_id]);

      if (result.affectedRows > 0) {
        return res.status(200).json({ message: "Table deleted successfully" });
      } else {
        console.error(`Deletion Error: Table not found for table_id = ${table_id}`);
        return res.status(404).json({ error: "Table not found" });
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      return res.status(500).json({ error: "An error occurred while deleting the table" });
    }
  }



  static async getAllUsersByBusinessEntity(req, res) {
    const { bEId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'SELECT users.id,users.first_name,users.email, users.phone,users.is_active,roles.description,roles.id as RoleId ' +
        'FROM users ' +
        'JOIN user_business_entity_role_mapping ON users.id = user_business_entity_role_mapping.user_id ' +
        'JOIN roles ON user_business_entity_role_mapping.role = roles.id ' +
        'WHERE user_business_entity_role_mapping.business_entity_id = ? AND user_business_entity_role_mapping.role !=?',
        [bEId, 1]
      );

      const allUsers = result.map(row => ({
        userid: row.id,
        name: row.first_name,
        email: row.email,
        phone: row.phone,
        roleId: row.RoleId,
        role: row.description,
        status: row.is_active
      }));
      res.status(200).json({ allUsers });
    } catch (err) {
      console.error('Error getting all users for business entity:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async changeUserActiveStat(req, res) {
    const { flag, userId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'UPDATE `users` SET `is_active`=? WHERE id=?',
        [flag, userId]
      );

      const message = flag === '0' ? 'User deactivated successfully' : 'User activated successfully';
      const updateStat = {
        userid: userId,
        is_active: flag,
        message: message
      };
      res.status(200).json({ updateStat });
    } catch (err) {
      console.error('Error deactivating/restoring user:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async addNewBusinessUser(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { role, userName, contactNo, Age, BusinessEntityId, userEmail } = req.body;
      const emailExists = await query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [userEmail]);
      if (emailExists[0].count > 0) {
        return res.status(400).json({ error: 'Email is already used' });
      }
      const userInsertResult = await query(
        'INSERT INTO users (first_name, email, phone,password, is_active) VALUES (?, ?, ?, ?,?)',
        [userName, userEmail, contactNo, contactNo, 0]
      );
      const userId = userInsertResult.insertId;
      await query(
        'INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role) VALUES (?, ?, ?)',
        [userId, BusinessEntityId, role]
      );

      return res.status(200).json({ message: 'User added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async deleteUserForBusiness(req, res) {
    const { userId } = req.body;
    db.query(
      'DELETE users, user_business_entity_role_mapping ' +
      'FROM users ' +
      'JOIN user_business_entity_role_mapping ON users.id = user_business_entity_role_mapping.user_id ' +
      'WHERE users.id = ?',
      [userId],
      (err, result) => {
        if (err) {
          console.error('Error deleting user:', err);
          console.error('Failed to delete user');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const message = 'User deleted successfully';
          const stat = {
            message: message
          };
          res.status(200).json({ stat });
        }
      }
    );
  }

  static async addUpdateMenuCategory(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { menuName, menuDescription, businessEntityId, categoryId } = req.body;
      if (categoryId) {
        await query(
          'UPDATE menu_category SET name = ?, description = ?, is_active = ? WHERE id = ?',
          [menuName, menuDescription, 1, categoryId]
        );

        return res.status(200).json({ message: 'Menu Category updated successfully' });
      } else {
        await query(
          'INSERT INTO menu_category (name, description, is_active, restaurant_id) VALUES (?, ?, ?, ?)',
          [menuName, menuDescription, 1, businessEntityId]
        );

        return res.status(200).json({ message: 'Menu Category added successfully' });
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async getAllMenuCategoryByBusinessEntity(req, res) {
    const { bEId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'SELECT id,name,description ' +
        'FROM menu_category ' +
        'WHERE restaurant_id = ? AND is_active=?',
        [bEId, 1]
      );

      const allCategories = result.map(row => ({
        category_id: row.id,
        category_name: row.name,
        description: row.description,
        status: row.is_active
      }));
      res.status(200).json({ allCategories });
    } catch (err) {
      console.error('Error getting all categories for business entity:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async addMenuItem(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { menuName, cgst, sgst, price, menu_category_id, code, businessEntityId } = req.body;
      var existingItem =[]
            
    if(code.length>0){
      existingItem = await query(
        'SELECT * FROM menu_items WHERE code = ? AND restaurant_id = ?',
        [code, businessEntityId]
      );
    }
  
      if (existingItem.length > 0) {
        return res.status(230).json({ error: 'The item code is already used by another menu item !' });
      }
  
      await query(
        'INSERT INTO menu_items (name, cgst, sgst, price, menu_category_id, code, is_active, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [menuName, cgst, sgst, price, menu_category_id, code, 1, businessEntityId]
      );
  
      return res.status(200).json({ message: 'Menu item added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  

  static async getAllMenuByBusinessEntity(req, res) {
    const { bEId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'SELECT id,name,cgst,sgst,price,code,is_active,menu_category_id ' +
        'FROM menu_items ' +
        'WHERE restaurant_id = ? AND is_active=?',
        [bEId, 1]
      );

      const allMenus = result.map(row => ({
        menu_id: row.id,
        menu_name: row.name,
        cgst: row.cgst,
        sgst: row.sgst,
        price: row.price,
        code: row.code,
        is_active: row.is_active,
        category_id: row.menu_category_id

      }));
      res.status(200).json({ allMenus });
    } catch (err) {
      console.error('Error getting all menu for business entity:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async addOrUpdateSection(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { sectionId, sectionName, sectionDescription, businessEntityId } = req.body;

      if (sectionId) {
        // Update existing section
        const result = await query(
          'UPDATE restaurant_sections SET name = ?, description = ? WHERE id = ? AND restaurant_id = ?',
          [sectionName, sectionDescription, sectionId, businessEntityId]
        );

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: 'Section not found or no changes made' });
        }

        return res.status(200).json({ message: 'Section updated successfully' });
      } else {
        // Add new section
        await query(
          'INSERT INTO restaurant_sections (name, description, restaurant_id) VALUES (?, ?, ?)',
          [sectionName, sectionDescription, businessEntityId]
        );

        return res.status(201).json({ message: 'Section added successfully' });
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async getAllSectionsByBusinessEntity(req, res) {
    const { bEId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'SELECT id,name,description ' +
        'FROM restaurant_sections ' +
        'WHERE restaurant_id = ? ',
        [bEId]
      );

      const allSections = result.map(row => ({
        section_id: row.id,
        section_name: row.name,
        description: row.description

      }));
      res.status(200).json({ allSections });
    } catch (err) {
      console.error('Error getting all sections for business entity:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async addOrUpdateTable(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { tableName, sectionId, businessEntityId, tableId } = req.body;
      console.log(req.body);


      if (tableId) {
        await query(
          'UPDATE tables SET label = ?, section_id = ?, restaurant_id = ?, status = ?, is_active = ? WHERE id = ?',
          [tableName, sectionId, businessEntityId, 'Available', 1, tableId]
        );
        return res.status(200).json({ message: 'Table updated successfully' });
      } else {
        await query(
          'INSERT INTO tables (label, section_id, restaurant_id, status, is_active) VALUES (?, ?, ?, ?, ?)',
          [tableName, sectionId, businessEntityId, 'Available', 1]
        );
        return res.status(201).json({ message: 'Table added successfully' });
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async getAllTablesByBusinessEntity(req, res) {
    const { bEId } = req.params;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        'SELECT tables.id,label, restaurant_sections.name,restaurant_sections.id as section_id ' +
        'FROM tables ' +
        'JOIN restaurant_sections ON tables.section_id = restaurant_sections.id ' +
        'WHERE tables.restaurant_id = ? ',
        [bEId]
      );

      const allTables = result.map(row => ({
        table_id: row.id,
        section_id: row.section_id,
        section: row.name,
        table_name: row.label

      }));
      res.status(200).json({ allTables });
    } catch (err) {
      console.error('Error getting all tables for business entity:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getAllProductsAndPlans(req, res) {
    try {
      const { userid } = req.body;
      const query = userid !== null ?
        `
          SELECT 
            products.product_id, 
            products.product_name, 
            products.description AS product_description, 
            products.video_url,
            products.icon,
            products.available_on as availableOn,
            plans.plan_id, 
            plans.name AS plan_name, 
            plans.description AS plan_description, 
            plans.price, 
            plans.billing_cycle,
            subscriptions.status,
            IF(subscriptions.plan_id IS NOT NULL, 1, 0) AS subscription_status
          FROM 
            products 
          LEFT JOIN 
            plans ON products.product_id = plans.product_id
          LEFT JOIN
            subscriptions ON plans.plan_id = subscriptions.plan_id AND subscriptions.user_id = ?
          WHERE 
            products.business_type IN (?, ?)
        ` :
        `
          SELECT 
            products.product_id, 
            products.product_name, 
            products.available_on as availableOn,
            products.description AS product_description, 
            products.video_url,
            products.icon,
            plans.plan_id, 
            plans.name AS plan_name, 
            plans.description AS plan_description, 
            plans.price, 
            plans.billing_cycle
          FROM 
            products 
          LEFT JOIN 
            plans ON products.product_id = plans.product_id
          WHERE 
            products.business_type IN (?, ?)
        `;
      const params = userid !== null ? [userid, 'R','RT'] : ['R','RT'];

      const results = await new Promise((resolve, reject) => {
        db.query(query, params, (err, results) => {
          if (err) {
            return reject(err);
          }
          resolve(results);
        });
      });
      const formattedResults = {};
      results.forEach(result => {
        const productId = result.product_id;
        if (!formattedResults[productId]) {
          formattedResults[productId] = {
            product_id: productId,
            product_name: result.product_name,
            availableOn: result.availableOn,
            product_icon: result.icon,
            video_url: result.video_url,
            product_description: result.product_description,
            plans: []
          };
        }

        if (result.plan_id) {
          formattedResults[productId].plans.push({
            plan_id: result.plan_id,
            name: result.plan_name,
            description: result.plan_description,
            price: result.price,
            billing_cycle: result.billing_cycle,
            status: result.status,
            subscription_status: result.subscription_status
          });
        }
      });
      res.json({ products: Object.values(formattedResults) });

    } catch (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }




  static async subscribeToProduct(req, res) {
    const { bEId } = req.body;
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(
        ''
      );


      res.status(200).json({});
    } catch (err) {
      console.error('Error :', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async subscribeToProduct(req, res) {
    const { user_id, plan_id, start_date, end_date, trial_start_date, trial_end_date, status } = req.body;
    const query = util.promisify(db.query).bind(db);

    if (user_id == null || plan_id == null) {
      return res.status(400).json({ error: 'User ID or Plan ID cannot be null' });
    }

    try {
      const sql = `
        INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, trial_start_date, trial_end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        user_id,
        plan_id,
        start_date,
        end_date,
        trial_start_date,
        trial_end_date,
        status,
      ];

      const result = await query(sql, values);

      res.status(200).json({ message: 'Subscription created successfully' });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getAllUnitsForRestaurant(req, res) {
    const { restaurantId } = req.params;
    db.query(
      'SELECT id AS unit_id, unit_name ' +
      'FROM unit ' +
      'WHERE restaurant_id = ?',
      [restaurantId],
      (err, result) => {
        if (err) {
          console.error('Error querying MySQL for units:', err);
          console.error('Failed SQL query for units');
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          const units = result.map(row => ({
            unitId: row.unit_id,
            unitName: row.unit_name
          }));
          res.status(200).json({ units });
        }
      }
    );
  }

  static async getAllUnitsConversionsForRestaurant(req, res) {
    const { restaurantId } = req.params;

    const sqlQuery = `
    SELECT 
    u1.id AS from_unit_id, u1.unit_name AS from_unit_name, 
    u2.id AS to_unit_id, u2.unit_name AS to_unit_name, 
    uc.id,
    uc.conversion_rate
  FROM 
    unit u1
  INNER JOIN 
    unit_conversion uc ON u1.id = uc.from_unit_id 
  INNER JOIN 
    unit u2 ON uc.to_unit_id = u2.id 
  WHERE 
    u1.restaurant_id = ? OR uc.restaurant_id = ?
  AND uc.conversion_rate IS NOT NULL
  `;

    db.query(sqlQuery, [restaurantId, restaurantId], (err, result) => {
      if (err) {
        console.error('Error querying MySQL for unit conversions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const units = result.map(row => ({
          id: row.id,
          fromUnitId: row.from_unit_id,
          fromUnitName: row.from_unit_name,
          toUnitId: row.to_unit_id,
          toUnitName: row.to_unit_name,
          conversionRate: row.conversion_rate
        }));
        res.status(200).json({ units });
      }
    });
  }

  static async getAllIngredientsForRestaurant(req, res) {
    const { restaurantId } = req.params;

    const sqlQuery = `
    SELECT 
    mi.id AS ingredient_id,
        mi.ingredient_name, 
        mi.calculated_position, 
        mi.last_updated_position, 
        mi.expiry_date, 
        mi.deviation_limit, 
        mi.threshold,
        u.id as unit_id,
        u.unit_name AS unit_name  
    FROM 
        menu_ingredients mi
    INNER JOIN 
        unit u ON mi.unit_id = u.id  
    WHERE 
        mi.restaurant_id = ?  
    `;

    db.query(sqlQuery, [restaurantId], (err, result) => {
      if (err) {
        console.error('Error querying MySQL for ingredients and units:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const ingredients = result.map(row => ({
          ingredientId: row.ingredient_id,
          ingredientName: row.ingredient_name,
          calculatedPosition: row.calculated_position,
          lastUpdatedPosition: row.last_updated_position,
          expiryDate: row.expiry_date,
          deviationLimit: row.deviation_limit,
          threshold: row.threshold,
          unitId: row.unit_id,
          unitName: row.unit_name
        }));

        res.status(200).json({ ingredients });
      }
    });
  }

  static async getAllRecipesForRestaurant(req, res) {
    const { restaurantId } = req.params;

    const sqlQuery = `
      SELECT 
        rm.id AS recipe_id, 
        rm.recipe_name, 
        mi.id AS ingredient_id,  
        mi.ingredient_name, 
        rmi.quantity,
        mi.calculated_position, 
        mi.last_updated_position, 
        mi.expiry_date, 
        mi.deviation_limit, 
        mi.threshold,
        u.unit_name AS unit_name,
        u.id AS unit_id  -- Add unit ID here
      FROM 
        recipe_master rm
      LEFT JOIN 
        recipe_menu_ingredient rmi ON rm.id = rmi.recipe_id
      LEFT JOIN 
        menu_ingredients mi ON rmi.menu_ingredient_id = mi.id
      LEFT JOIN 
        unit u ON rmi.unit_id = u.id  
      WHERE 
        rm.restaurant_id = ?  
    `;

    db.query(sqlQuery, [restaurantId], (err, result) => {
      if (err) {
        console.error('Error querying MySQL for recipes and ingredients:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const recipesMap = {};

        result.forEach(row => {
          const {
            recipe_id,
            recipe_name,
            ingredient_id,
            ingredient_name,
            quantity,
            calculated_position,
            last_updated_position,
            expiry_date,
            deviation_limit,
            threshold,
            unit_name,
            unit_id
          } = row;

          if (!recipesMap[recipe_id]) {
            recipesMap[recipe_id] = {
              recipeId: recipe_id,
              recipeName: recipe_name,
              ingredients: []
            };
          }

          // Push ingredient only if it exists
          if (ingredient_id) {
            recipesMap[recipe_id].ingredients.push({
              ingredientId: ingredient_id,
              ingredientName: ingredient_name,
              quantity: quantity,
              calculatedPosition: calculated_position,
              lastUpdatedPosition: last_updated_position,
              expiryDate: expiry_date,
              deviationLimit: deviation_limit,
              threshold: threshold,
              unitName: unit_name,
              unitId: unit_id
            });
          }
        });

        const recipes = Object.values(recipesMap);

        res.status(200).json({ recipes });
      }
    });
  }




  static async getRecipesAndItemsForRestaurant(req, res) {
    const { restaurantId } = req.params;
    const sqlQuery = `
    SELECT 
      rm.id AS recipe_id, 
      rm.recipe_name, 
      mi.id AS menu_item_id,      
      mi.name AS menu_item_name   
    FROM 
      recipe_master rm
    LEFT JOIN 
      menu_items mi ON rm.id = mi.recipe_id
    WHERE 
      rm.restaurant_id = ?
  `;
    db.query(sqlQuery, [restaurantId], (err, result) => {
      if (err) {
        console.error('Error querying MySQL for recipes and menu items:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      const recipesMap = {};

      result.forEach(row => {
        const { recipe_id, recipe_name, menu_item_id, menu_item_name } = row;
        if (!recipesMap[recipe_id]) {
          recipesMap[recipe_id] = {
            recipeId: recipe_id,
            recipeName: recipe_name,
            menuItems: []
          };
        }
        if (menu_item_id && menu_item_name) {
          recipesMap[recipe_id].menuItems.push({
            menuItemId: menu_item_id,
            menuItem: menu_item_name
          });
        }
      });
      const recipes = Object.values(recipesMap);
      res.status(200).json({ recipes });
    });
  }



  static async addUnit(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { unitName, unitShortName, businessEntityId } = req.body;
      const existingUnit = await query(
        'SELECT * FROM unit WHERE unit_name = ? AND restaurant_id = ?',
        [unitName, businessEntityId]
      );

      if (existingUnit.length > 0) {
        return res.status(400).json({ message: 'Unit already exists' });
      }
      await query(
        'INSERT INTO unit (unit_name, short_name, restaurant_id) VALUES (?,?,?)',
        [unitName, unitShortName, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async updateUnit(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const unitId = req.params.unitId;
      const { unitName, unitShortName, businessEntityId } = req.body;

      const existingUnit = await query(
        'SELECT * FROM unit WHERE id = ? AND restaurant_id = ?',
        [unitId, businessEntityId]
      );

      if (existingUnit.length === 0) {
        return res.status(404).json({ message: 'Unit not found' });
      }

      const duplicateUnit = await query(
        'SELECT * FROM unit WHERE unit_name = ? AND restaurant_id = ? AND id != ?',
        [unitName, businessEntityId, unitId]
      );

      if (duplicateUnit.length > 0) {
        return res.status(400).json({ message: 'Another unit with this name already exists' });
      }
      await query(
        'UPDATE unit SET unit_name = ?, short_name = ? WHERE id = ? AND restaurant_id = ?',
        [unitName, unitShortName, unitId, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit updated successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async addUnitConversion(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { fromUnitId, toUnitId, conversionRate, businessEntityId } = req.body;
      const existingConversion = await query(
        'SELECT * FROM unit_conversion WHERE from_unit_id = ? AND to_unit_id = ? AND restaurant_id = ?',
        [fromUnitId, toUnitId, businessEntityId]
      );

      if (existingConversion.length > 0) {
        return res.status(400).json({ message: 'Unit conversion already exists' });
      }
      await query(
        'INSERT INTO unit_conversion (from_unit_id, to_unit_id, conversion_rate, restaurant_id) VALUES (?, ?, ?, ?)',
        [fromUnitId, toUnitId, conversionRate, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit conversion added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async addIngredient(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { ingredientName, unitId, deviationLimit, lowStockAlert, businessEntityId } = req.body;
      const existingConversion = await query(
        'SELECT * FROM menu_ingredients WHERE ingredient_name = ? AND restaurant_id = ?',
        [ingredientName, businessEntityId]
      );

      if (existingConversion.length > 0) {
        return res.status(400).json({ message: 'The ingredient already exists' });
      }
      await query(
        'INSERT INTO menu_ingredients (ingredient_name,unit_id,deviation_limit,threshold,calculated_position,last_updated_position,last_updated_time, restaurant_id) VALUES (?, ?, ?, ?,?,?,?,?)',
        [ingredientName, unitId, deviationLimit, lowStockAlert, 0, 0, new Date(), businessEntityId]
      );

      return res.status(200).json({ message: 'Ingredient has been added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async addRecipe(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { recipeName, restaurantId, ingredients } = req.body;

      const recipeInsertResult = await query(
        'INSERT INTO recipe_master (recipe_name, restaurant_id) VALUES (?, ?)',
        [recipeName, restaurantId]
      );

      const recipeId = recipeInsertResult.insertId;

      const ingredientInsertPromises = ingredients.map(async (ingredient) => {
        const { menuIngredientId, unitId, quantity } = ingredient;
        await query(
          'INSERT INTO recipe_menu_ingredient (recipe_id, menu_ingredient_id, restaurant_id, unit_id,quantity) VALUES (?, ?, ?, ?,?)',
          [recipeId, menuIngredientId, restaurantId, unitId, quantity]
        );
      });

      await Promise.all(ingredientInsertPromises);

      return res.status(200).json({ message: 'Recipe and ingredients have been added successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async updateRecipeMenuLinks(req, res) {
    const query = util.promisify(db.query).bind(db);

    try {
      const { recipeId, menuItems, restaurantId } = req.body;

      if (!recipeId || !Array.isArray(menuItems) || !restaurantId) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      const existingLinkedMenuItems = await query(`
            SELECT id AS menu_id 
            FROM menu_items 
            WHERE recipe_id = ? AND restaurant_id = ?`,
        [recipeId, restaurantId]
      );

      const existingMenuItemIds = existingLinkedMenuItems.map(item => item.menu_id);

      const menuItemsToAdd = menuItems
        .filter(item => !existingMenuItemIds.includes(item.menu_id))
        .map(item => item.menu_id);

      const menuItemsToRemove = existingMenuItemIds.filter(item =>
        !menuItems.map(i => i.menu_id).includes(item)
      );

      await query('START TRANSACTION');

      // Add new menu items
      if (menuItemsToAdd.length > 0) {
        await query(`
                UPDATE menu_items 
                SET recipe_id = ? 
                WHERE id IN (?) AND restaurant_id = ?`,
          [recipeId, menuItemsToAdd, restaurantId]
        );
      }

      // Remove old menu items
      if (menuItemsToRemove.length > 0) {
        await query(`
                UPDATE menu_items 
                SET recipe_id = NULL 
                WHERE id IN (?) AND restaurant_id = ?`,
          [menuItemsToRemove, restaurantId]
        );
      }
      await query('COMMIT');

      return res.status(200).json({ message: 'Recipe menu items updated successfully' });
    } catch (error) {
      await query('ROLLBACK');

      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }


  static async updateUnitConversion(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { id, fromUnitId, toUnitId, conversionRate } = req.body;
      const { businessEntityId } = req.body;

      const existingConversion = await query(
        'SELECT * FROM unit_conversion WHERE id = ? AND restaurant_id = ?',
        [id, businessEntityId]
      );

      if (existingConversion.length === 0) {
        return res.status(404).json({ message: 'Unit conversion not found.' });
      }

      await query(
        'UPDATE unit_conversion SET from_unit_id = ?, to_unit_id = ?, conversion_rate = ? WHERE id = ? AND restaurant_id = ?',
        [fromUnitId, toUnitId, conversionRate, id, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit conversion updated successfully.' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async updateRecipe(req, res) {
    const query = util.promisify(db.query).bind(db);

    try {
      const { recipeId } = req.params;
      const { recipeName, ingredients, restaurantId } = req.body;

      if (!recipeId || !recipeName || !Array.isArray(ingredients) || !restaurantId) {
        return res.status(400).json({ error: 'Invalid input data' });
      }
      await query('START TRANSACTION');

      await query(`
          UPDATE recipe_master 
          SET recipe_name = ? 
          WHERE id = ? AND restaurant_id = ?`,
        [recipeName, recipeId, restaurantId]
      );

      const existingIngredients = await query(`
          SELECT menu_ingredient_id 
          FROM recipe_menu_ingredient 
          WHERE recipe_id = ?`,
        [recipeId]
      );

      const existingIngredientIds = existingIngredients.map(item => item.menu_ingredient_id);

      const ingredientsToAdd = ingredients.filter(ingredient => !existingIngredientIds.includes(ingredient.menuIngredientId));

      const ingredientsToUpdate = ingredients.filter(ingredient => existingIngredientIds.includes(ingredient.menuIngredientId));

      const ingredientsToRemove = existingIngredientIds.filter(id => !ingredients.map(i => i.menuIngredientId).includes(id));

      if (ingredientsToAdd.length > 0) {
        const valuesToInsert = ingredientsToAdd.map(ingredient => [recipeId, ingredient.menuIngredientId, ingredient.quantity, restaurantId]);
        await query(`
              INSERT INTO recipe_menu_ingredient (recipe_id, menu_ingredient_id, quantity, restaurant_id) 
              VALUES ?`,
          [valuesToInsert]
        );
      }

      for (let ingredient of ingredientsToUpdate) {
        await query(`
              UPDATE recipe_menu_ingredient 
              SET quantity = ?, unit_id = ? 
              WHERE recipe_id = ? AND menu_ingredient_id = ?`,
          [ingredient.quantity, ingredient.unitId, recipeId, ingredient.menuIngredientId]
        );
      }

      if (ingredientsToRemove.length > 0) {
        await query(`
              DELETE FROM recipe_menu_ingredient 
              WHERE recipe_id = ? AND menu_ingredient_id IN (?)`,
          [recipeId, ingredientsToRemove]
        );
      }

      await query('COMMIT');

      return res.status(200).json({ message: 'Recipe updated successfully' });

    } catch (error) {
      await query('ROLLBACK');
      console.error('Error updating recipe:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  static async updateIngredient(req, res) {
    const { ingredientId } = req.params;
    const { ingredientName, unitId, deviationLimit, lowStockAlert, businessEntityId } = req.body;


    const sqlQuery = `
      UPDATE menu_ingredients
      SET 
        ingredient_name = ?, 
        unit_id = ?, 
        deviation_limit = ?, 
        threshold = ?, 
        restaurant_id = ? 
      WHERE 
        id = ?
    `;

    db.query(sqlQuery, [ingredientName, unitId, deviationLimit, lowStockAlert, businessEntityId, ingredientId], (err, result) => {
      if (err) {
        console.error('Error updating ingredient:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Ingredient not found.' });
      }

      res.status(200).json({ message: 'Ingredient updated successfully.' });
    });
  }


  //delete
  static async deleteUnit(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { unitId } = req.params;
      const { businessEntityId } = req.query;

      const linkedConversions = await query(
        `SELECT * FROM unit_conversion 
       WHERE (from_unit_id = ? OR to_unit_id = ?) 
       AND restaurant_id = ?`,
        [unitId, unitId, businessEntityId]
      );

      if (linkedConversions.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete unit. It is linked to a unit conversion.',
        });
      }

      const linkedIngredients = await query(
        `SELECT * FROM menu_ingredients 
       WHERE unit_id = ? AND restaurant_id = ?`,
        [unitId, businessEntityId]
      );

      if (linkedIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete unit. It is linked to a menu ingredient.',
        });
      }

      const linkedRecipeIngredients = await query(
        `SELECT * FROM recipe_menu_ingredient 
       WHERE unit_id = ? AND restaurant_id = ?`,
        [unitId, businessEntityId]
      );

      if (linkedRecipeIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete unit. It is linked to a recipe\'s menu ingredient.',
        });
      }
      await query(
        'DELETE FROM unit WHERE id = ? AND restaurant_id = ?',
        [unitId, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async deleteUnitConversion(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { conversionId } = req.params;
      const { businessEntityId } = req.query;

      const conversionDetails = await query(
        `SELECT to_unit_id FROM unit_conversion 
             WHERE id = ? AND restaurant_id = ?`,
        [conversionId, businessEntityId]
      );

      if (conversionDetails.length === 0) {
        return res.status(404).json({ message: 'Conversion not found' });
      }

      const { to_unit_id } = conversionDetails[0];

      const linkedIngredients = await query(
        `SELECT * FROM menu_ingredients 
             WHERE unit_id = ? 
             AND restaurant_id = ?`,
        [to_unit_id, businessEntityId]
      );

      if (linkedIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete conversion. The conversion unit is used in menu ingredients.',
        });
      }

      const linkedRecipeIngredients = await query(
        `SELECT * FROM recipe_menu_ingredient 
             WHERE unit_id = ? 
             AND restaurant_id = ?`,
        [to_unit_id, businessEntityId]
      );

      if (linkedRecipeIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete conversion. The conversion unit is used in a recipe\'s menu ingredient.',
        });
      }


      await query(
        'DELETE FROM unit_conversion WHERE id = ? AND restaurant_id = ?',
        [conversionId, businessEntityId]
      );

      return res.status(200).json({ message: 'Unit conversion deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }



  static async deleteIngredient(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { ingredientId } = req.params;
      const { businessEntityId } = req.query;

      const linkedRecipeIngredients = await query(
        `SELECT * FROM recipe_menu_ingredient 
       WHERE menu_ingredient_id = ? AND restaurant_id = ?`,
        [ingredientId, businessEntityId]
      );

      if (linkedRecipeIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete ingredient. It is already linked to a recipe.',
        });
      }
      await query(
        'DELETE FROM menu_ingredients WHERE id = ? AND restaurant_id = ?',
        [ingredientId, businessEntityId]
      );

      return res.status(200).json({ message: 'Ingredient was deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async deleteRecipe(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const { recipeId } = req.params;
      const { businessEntityId } = req.query;

      const linkedRecipeMenu = await query(
        ` SELECT * 
    FROM 
      recipe_master rm
    INNER JOIN 
      menu_items mi ON rm.id = mi.recipe_id
    WHERE 
    rm.id=? AND
      rm.restaurant_id = ?`,
        [recipeId, businessEntityId]
      );


      if (linkedRecipeMenu.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete recipe. It has one or more menu items linked to it.',
        });
      }

      const linkedRecipeIngredients = await query(
        `SELECT * FROM recipe_menu_ingredient 
       WHERE recipe_id = ? AND restaurant_id = ?`,
        [recipeId, businessEntityId]
      );

      if (linkedRecipeIngredients.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete recipe. It has one or more ingredients linked to it.',
        });
      }
      await query(
        'DELETE FROM recipe_master WHERE id = ? AND restaurant_id = ?',
        [recipeId, businessEntityId]
      );

      return res.status(200).json({ message: 'Recipe was deleted successfully' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // static async updatePosition(req, res) {
  //   const query = util.promisify(db.query).bind(db);

  //   const { ingredient_id, new_quantity, reason, is_purchase, still_proceed, userId, restaurantId } = req.body;

  //   if (is_purchase === false) {
  //     if (!ingredient_id || !new_quantity || !reason || is_purchase === undefined || !restaurantId || !userId) {
  //       return res.status(400).json({
  //         error: true,
  //         message: "Missing required data to update current position."
  //       });
  //     }
  //   } else {
  //     if (!ingredient_id || !new_quantity || is_purchase === undefined || !restaurantId || !userId) {
  //       return res.status(400).json({
  //         error: true,
  //         message: "Missing required data to add purchase items."
  //       });
  //     }
  //   }

  //   try {
  //     const [rows] = await query(
  //       'SELECT calculated_position, last_updated_position, deviation_limit FROM menu_ingredients WHERE id = ? AND restaurant_id = ?',
  //       [ingredient_id, restaurantId]
  //     );

  //     if (!rows || rows.length === 0) {
  //       return res.status(404).json({
  //         error: true,
  //         message: "Ingredient was not found."
  //       });
  //     }

  //     const { calculated_position, last_updated_position, deviation_limit } = rows;

  //     const allowed_deviation = (calculated_position * deviation_limit) / 100;
  //     const newPurchasePosition = last_updated_position + new_quantity;
  //     const calculatedPurchasePosition = calculated_position + new_quantity;

  //     if (!is_purchase && !still_proceed && new_quantity < calculated_position && (calculated_position - new_quantity) > allowed_deviation) {
  //       return res.status(400).json({
  //         error: true,
  //         allowProceed: true,
  //         message: `New quantity exceeds allowed deviation of ${allowed_deviation}, which is ${deviation_limit}%.`
  //       });
  //     }

  //     if (is_purchase) {
  //       await query(
  //         'UPDATE menu_ingredients SET calculated_position = ?, last_updated_position = ? , last_purchase_date = NOW() WHERE id = ? AND restaurant_id = ?',
  //         [calculatedPurchasePosition, newPurchasePosition, ingredient_id, restaurantId]
  //       );
  //     } else {
  //       await query(
  //         'UPDATE menu_ingredients SET calculated_position = ?, last_updated_position = ? WHERE id = ? AND restaurant_id = ?',
  //         [new_quantity, new_quantity, ingredient_id, restaurantId]
  //       );
  //     }

  //     await query(
  //       'INSERT INTO inventory_update_logs (ingredient_id, new_quantity, calculated_position, last_updated_position, reason, purchase_log, update_time,user_id, restaurant_id,forced_update) VALUES (?, ?, ?, ?, ?, ?, NOW(),?, ?,?)',
  //       [
  //         ingredient_id,
  //         new_quantity,
  //         calculated_position,
  //         last_updated_position,
  //         is_purchase ? 'Added due to a purchase' : reason,
  //         is_purchase ? 1 : 0,
  //         userId,
  //         restaurantId,
  //         still_proceed ? 1 : 0
  //       ]
  //     );

  //     return res.status(200).json({
  //       error: false,
  //       message: "Inventory updated successfully."
  //     });

  //   } catch (error) {
  //     console.error(error);
  //     return res.status(500).json({
  //       error: true,
  //       message: "Internal server error."
  //     });
  //   }
  // }

  static async updatePosition(req, res) {
    const query = util.promisify(db.query).bind(db);

    const { ingredient_id, new_quantity, reason, is_purchase, still_proceed, userId, restaurantId,purchase_amount } = req.body;

    if (is_purchase === false) {
      if (!ingredient_id || !new_quantity ||!purchase_amount|| !reason || is_purchase === undefined || !restaurantId || !userId) {
        return res.status(400).json({
          error: true,
          message: "Missing required data to update current position."
        });
      }
    } else {
      if (!ingredient_id || !new_quantity || is_purchase === undefined || !restaurantId || !userId) {
        return res.status(400).json({
          error: true,
          message: "Missing required data to add purchase items."
        });
      }
    }

    try {

      const [rows] = await query(
        'SELECT calculated_position, last_updated_position, deviation_limit FROM menu_ingredients WHERE id = ? AND restaurant_id = ?',
        [ingredient_id, restaurantId]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Ingredient was not found."
        });
      }

      const { calculated_position, last_updated_position, deviation_limit } = rows;

      const allowed_deviation = (calculated_position * deviation_limit) / 100;
      const newPurchasePosition = last_updated_position + new_quantity;
      const calculatedPurchasePosition = calculated_position + new_quantity;

      // update position
      if (!is_purchase) {
        const purchaseLog = await query(
          'SELECT 1 FROM inventory_update_logs WHERE ingredient_id = ? AND restaurant_id = ? AND purchase_log = 1 LIMIT 1',
          [ingredient_id, restaurantId]
        );

        if (!purchaseLog || purchaseLog.length === 0) {
          return res.status(400).json({
            error: true,
            message: "Please make a purchase addition before updating position."
          });
        }


        // Validate deviation: when still_proceed = false
        if (!still_proceed && new_quantity < calculated_position && (calculated_position - new_quantity) > allowed_deviation) {
          return res.status(400).json({
            error: true,
            allowProceed: true,
            message: `New quantity exceeds allowed deviation of ${allowed_deviation}, which is ${deviation_limit}%.`
          });
        }

        await query(
          'UPDATE menu_ingredients SET calculated_position = ? WHERE id = ? AND restaurant_id = ?',
          [new_quantity, ingredient_id, restaurantId]
        );
      } else {
        // purchase addition
        await query(
          'UPDATE menu_ingredients SET calculated_position = ?, last_updated_position = ?, last_purchase_date = NOW() WHERE id = ? AND restaurant_id = ?',
          [calculatedPurchasePosition, newPurchasePosition, ingredient_id, restaurantId]
        );
      }


      await query(
        'INSERT INTO inventory_update_logs (ingredient_id, new_quantity, calculated_position, last_updated_position, reason, purchase_log, update_time, user_id, restaurant_id, forced_update,purchase_amount) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?,?)',
        [
          ingredient_id,
          new_quantity,
          calculated_position,
          last_updated_position,
          is_purchase ? 'Added due to a purchase' : reason,
          is_purchase ? 1 : 0,
          userId,
          restaurantId,
          still_proceed ? 1 : 0,
          purchase_amount
        ]
      );

      return res.status(200).json({
        error: false,
        message: "Inventory updated successfully."
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: true,
        message: "Internal server error."
      });
    }
  }




  static async getInventoryLogs(req, res) {
    const query = util.promisify(db.query).bind(db);
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        error: true,
        message: "Missing required restaurant ID."
      });
    }

    try {
      const sqlQuery = `
        SELECT 
          iul.id as log_id, 
          mi.ingredient_name, 
          u.first_name AS updated_by,
          iul.new_quantity, 
          iul.calculated_position, 
          iul.last_updated_position, 
          iul.reason, 
          iul.purchase_log, 
          iul.purchase_amount,
          iul.forced_update, 
          iul.update_time, 
          iul.restaurant_id 
        FROM 
          inventory_update_logs iul
        LEFT JOIN 
          menu_ingredients mi 
        ON 
          iul.ingredient_id = mi.id
        LEFT JOIN 
          users u 
           ON 
          iul.user_id = u.id
        WHERE 
          iul.restaurant_id = ?`;

      const logs = await query(sqlQuery, [restaurantId]);


      if (!logs || logs.length === 0) {
        return res.status(404).json({
          error: true,
          logs: [],
          message: "No inventory logs found."
        });
      }

      return res.status(200).json({
        error: false,
        logs
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: true,
        logs: [],
        message: "Internal server error."
      });
    }
  }

  //lipika
  static async getBusinessesWithoutRestaurants(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
      const result = await query(`
      SELECT 
        be.business_entity_id,
        be.business_name,
        be.name,
        be.email,
        be.contact_no,
        be.business_type,
        be.group_id
      FROM business_entity be
      WHERE be.business_type = 'G'
      AND NOT EXISTS (
          SELECT 1 
          FROM business_entity r 
          WHERE r.group_id = be.business_entity_id 
          AND r.business_type = 'R'
      );
    `);

      res.json(result);
    } catch (err) {
      console.error('Error getting businesses without restaurants:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getBusinessEntitiesforpasswordreset(req, res) {
    const query = util.promisify(db.query).bind(db);

    try {
      const results = await query(`
       SELECT 
  u.id AS user_id,
  u.first_name AS username,
  u.email,
  u.password, -- Including password in API response is a security risk
  be.business_entity_id,
  be.name,
  -- Separate business_name and restaurant_name based on business_type
  -- Fetch the business name based on group_id
  COALESCE(
      (SELECT b2.business_name 
       FROM business_entity b2 
       WHERE b2.group_id = be.group_id AND b2.business_type = 'G' ), 
      'N/A'
  ) AS business_name,
  CASE 
      WHEN be.business_type = 'R' THEN be.business_name 
      ELSE NULL 
  END AS restaurant_name,
  r.description AS role_description,
  COALESCE(be.name, 'N/A') 
FROM 
  users u
LEFT JOIN 
  user_business_entity_role_mapping uberm ON u.id = uberm.user_id
LEFT JOIN 
  business_entity be ON uberm.business_entity_id = be.business_entity_id
LEFT JOIN 
  roles r ON uberm.role = r.id
ORDER BY 
  u.id, be.business_entity_id;

      
    `);

      res.json(results);
    } catch (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async passwordreset(req, res) {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      console.error("Password is required");
      return res.status(400).json({ message: "Password is required" });
    }

    try {
      const [result] = await db.promise().query(
        'UPDATE users SET Password = ? WHERE id = ?',
        [password, id]
      );
      if (result.affectedRows === 0) {
        console.error("Business entity not found for ID:", id);
        return res.status(404).json({ message: "Business entity not found" });
      }

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }

  static async getAllRegisteredBusinessEntities(req, res) {
    const query = util.promisify(db.query).bind(db);

    try {
      const results = await query(`
      SELECT group_id, be.*, u.password
    FROM business_entity be
    JOIN users u ON be.email = u.email
      WHERE be.business_type = ?
    `, ['G']);
      res.json(results);
    } catch (error) {
      console.error('Error querying MySQL:', error);
      console.error('Failed SQL query:', 'SELECT * FROM business_entity');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async uploadMenuCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const restaurant_id = req.body.restaurant_id?.toString().trim().toLowerCase();

    if (!restaurant_id) {
      return res.status(400).json({ error: 'Restaurant ID is invalid or empty' });
    }

    const query = util.promisify(db.query).bind(db);
    const results = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const row of results) {
        if (!row || typeof row !== 'object') {
          console.error('Invalid row data:', row);
          return res.status(400).json({ error: 'Invalid menu data was found in CSV' });
        }


        const menu_item_name = row.menu_item_name?.trim().toLowerCase();
        const menu_category_name = row.menu_category_name?.trim().toLowerCase();
        const cgst = row.cgst?.toString().trim();
        const sgst = row.sgst?.toString().trim();
        const price = row.price?.toString().trim();


        if (!menu_item_name || !menu_category_name || !price) {
          return res.status(400).json({ error: 'Missing required data (either name, category or price) in the uploaded CSV' });
        }

        try {
          let [existingCategory] = await query(
            'SELECT id FROM menu_category WHERE LOWER(name) = ? AND LOWER(restaurant_id) = ?',
            [menu_category_name, restaurant_id]
          );

          let categoryId;

          if (!existingCategory) {
            const categoryInsertResult = await query(
              'INSERT INTO menu_category (name, restaurant_id, is_active) VALUES (?, ?, 1)',
              [menu_category_name, restaurant_id]
            );
            categoryId = categoryInsertResult.insertId;
          } else {
            categoryId = existingCategory.id;
          }

          let [existingMenuItem] = await query(
            'SELECT id FROM menu_items WHERE LOWER(name) = ? AND LOWER(restaurant_id) = ?',
            [menu_item_name, restaurant_id]
          );

          if (existingMenuItem) {
            await query(
              'UPDATE menu_items SET cgst = ?, sgst = ?, price = ?, menu_category_id = ? WHERE id = ?',
              [
                parseFloat(cgst || 0),
                parseFloat(sgst || 0),
                parseFloat(price || 0),
                categoryId,
                existingMenuItem.id
              ]
            );
          } else {
            await query(
              'INSERT INTO menu_items (name, cgst, sgst, price, is_active, menu_category_id, restaurant_id) VALUES (?, ?, ?, ?, 1, ?, ?)',
              [
                menu_item_name,
                parseFloat(cgst || 0),
                parseFloat(sgst || 0),
                parseFloat(price || 0),
                categoryId,
                restaurant_id
              ]
            );
          }

        } catch (rowError) {
          console.error(`Error processing row: ${JSON.stringify(row)}`, rowError);
          return res.status(500).json({ error: `Error processing row: ${JSON.stringify(row)}` });
        }
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({ message: 'CSV data successfully imported' });
    } catch (error) {
      console.error('Error processing CSV:', error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to process CSV file' });
    }
  }




  static async uploadCategoryCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const restaurant_id = req.body.restaurant_id?.toString().trim().toLowerCase();
    if (!restaurant_id) {
      return res.status(400).json({ error: 'Restaurant ID is invalid or empty' });
    }

    const query = util.promisify(db.query).bind(db);
    const results = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const row of results) {
        if (!row || typeof row !== 'object') {
          console.error('Invalid row data:', row);
          return res.status(400).json({ error: 'Invalid category data was found in CSV' });
        }

        const menu_category_name = row.menu_category?.trim().toLowerCase();
        if (!menu_category_name) {
          return res.status(400).json({ error: 'Missing required data (category name) in the uploaded CSV' });
        }

        try {
          let [existingCategory] = await query(
            'SELECT id FROM menu_category WHERE LOWER(name) = ? AND LOWER(restaurant_id) = ?',
            [menu_category_name, restaurant_id]
          );

          if (!existingCategory) {
            await query(
              'INSERT INTO menu_category (name, restaurant_id, is_active) VALUES (?, ?, 1)',
              [menu_category_name, restaurant_id]
            );
          }

        } catch (rowError) {
          console.error(`Error processing row: ${JSON.stringify(row)}`, rowError);
          return res.status(500).json({ error: `Error processing row: ${JSON.stringify(row)}` });
        }
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({ message: 'Category CSV data successfully imported' });
    } catch (error) {
      console.error('Error processing CSV:', error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to process CSV file' });
    }
  }

  static async uploadSectionCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const restaurant_id = req.body.restaurant_id?.toString().trim().toLowerCase();
    if (!restaurant_id) {
      return res.status(400).json({ error: 'Restaurant ID is invalid or empty' });
    }

    const query = util.promisify(db.query).bind(db);
    const results = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const row of results) {
        if (!row || typeof row !== 'object') {
          console.error('Invalid row data:', row);
          return res.status(400).json({ error: 'Invalid section data was found in CSV' });
        }

        const section_name = row.section_name?.trim().toLowerCase();
        if (!section_name) {
          return res.status(400).json({ error: 'Missing required data (section name) in the uploaded CSV' });
        }

        try {
          let [existing] = await query(
            'SELECT id FROM restaurant_sections WHERE LOWER(name) = ? AND LOWER(restaurant_id) = ?',
            [section_name, restaurant_id]
          );

          if (!existing) {
            await query(
              'INSERT INTO restaurant_sections (name, restaurant_id) VALUES (?, ?)',
              [section_name, restaurant_id]
            );
          }

        } catch (rowError) {
          console.error(`Error processing row: ${JSON.stringify(row)}`, rowError);
          return res.status(500).json({ error: `Error processing row: ${JSON.stringify(row)}` });
        }
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({ message: 'Section CSV data successfully imported' });
    } catch (error) {
      console.error('Error processing CSV:', error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to process CSV file' });
    }
  }

  static async uploadTableCSV(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const restaurant_id = req.body.restaurant_id?.toString().trim().toLowerCase();

    if (!restaurant_id) {
      return res.status(400).json({ error: 'Restaurant ID is invalid or empty' });
    }

    const query = util.promisify(db.query).bind(db);
    const results = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const row of results) {
        if (!row || typeof row !== 'object') {
          console.error('Invalid row data:', row);
          return res.status(400).json({ error: 'Invalid table/section data found in CSV' });
        }

        const table_name = row.table_name?.trim().toLowerCase();
        const section_name = row.section_name?.trim().toLowerCase();

        if (!table_name || !section_name) {
          return res.status(400).json({ error: 'Missing required data (either table name or section name) in the uploaded CSV' });
        }

        try {
          let [existingSection] = await query(
            'SELECT id FROM restaurant_sections WHERE LOWER(name) = ? AND LOWER(restaurant_id) = ?',
            [section_name, restaurant_id]
          );

          let sectionId;

          if (!existingSection) {
            const sectionInsertResult = await query(
              'INSERT INTO restaurant_sections (name, restaurant_id) VALUES (?, ?)',
              [section_name, restaurant_id]
            );
            sectionId = sectionInsertResult.insertId;
          } else {
            sectionId = existingSection.id;
          }


          let [existingTable] = await query(
            'SELECT id FROM tables WHERE LOWER(label) = ? AND LOWER(restaurant_id) = ?',
            [table_name, restaurant_id]
          );


          if (existingTable) {
            await query(
              'UPDATE tables SET section_id = ? WHERE id = ?',
              [sectionId, existingTable.id]
            );
          } else {
            await query(
              'INSERT INTO tables (label, section_id, restaurant_id) VALUES (?, ?, ?)',
              [table_name, sectionId, restaurant_id]
            );
          }

        } catch (rowError) {
          console.error(`Error processing row: ${JSON.stringify(row)}`, rowError);
          return res.status(500).json({ error: `Error processing row: ${JSON.stringify(row)}` });
        }
      }

      fs.unlinkSync(req.file.path);

      return res.status(200).json({ message: 'Tables CSV data successfully imported' });
    } catch (error) {
      console.error('Error processing CSV:', error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ error: 'Failed to process CSV file' });
    }
  }




}

export { BusinessEntityController };
