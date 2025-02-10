import db from '../config/db.js';
import util from 'util';


class retailController{
    static async addRetailBusiness(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const { retailName, Cashier, Email, contactNo, Address, Group_ID, GstNumber, CashierEmail } = req.body;
    
          const emailExists = await query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [CashierEmail]);
          if (emailExists[0].count > 0) {
            return res.status(400).json({ error: 'Email is already used' });
          }
    
          const userInsertResult = await query(
            'INSERT INTO users (first_name, email, password, is_active) VALUES (?, ?, ?, ?)',
            [Cashier, CashierEmail, CashierEmail, 0]
          );
    
          const userId = userInsertResult.insertId;
          const role = 3; // Assuming 3 is the role for Cashier
    
          const businessInsertResult = await query(
            'INSERT INTO business_entity (business_name, name, email, contact_no, address, group_id, business_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [retailName, Cashier, Email, contactNo, Address, Group_ID, 'RT']
          );
    
          await query(
            'INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role) VALUES (?, ?, ?)',
            [userId, businessInsertResult.insertId, role]
          );
    
          await query(
            'INSERT INTO retail_shops (id, name, gst_no) VALUES (?, ?, ?)',
            [businessInsertResult.insertId, retailName, GstNumber]
          );
    
          return res.status(200).json({ message: 'Retail business and cashier registered successfully' });
        } catch (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      static async getAllRetailShops(req, res) {
        const groupId = req.params.groupId;
        const query = util.promisify(db.query).bind(db);
    
        try {
          const results = await query('SELECT * FROM business_entity WHERE group_id = ? AND business_type =?', [groupId, 'RT']);
          res.json(results);
        } catch (error) {
          console.error('Error querying MySQL:', error);
          console.error('Failed SQL query:', 'SELECT * FROM BusinessEntity');
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      // Add a Category
    static async addCategory(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { name, description, isActive, retailShopId } = req.body;
            await query(
                'INSERT INTO retail_category (name, description, is_active, retail_shop_id) VALUES (?, ?, ?, ?)',
                [name, description, isActive, retailShopId]
            );
            res.status(200).json({ message: 'Category added successfully' });
        } catch (error) {
            console.error('Error adding category:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAllCategories(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const retailShopId = req.params.retailShopId; // Get Retail Shop ID from URL
          const categories = await query(
            'SELECT * FROM retail_category WHERE retail_shop_id = ? AND is_active = 1',
            [retailShopId]
          );
          res.status(200).json(categories);
        } catch (error) {
          console.error('Error fetching categories:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      

    // Edit a Category
    static async editCategory(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id, name, description, isActive } = req.body;
            await query(
                'UPDATE retail_category SET name = ?, description = ?, is_active = ? WHERE id = ?',
                [name, description, isActive, id]
            );
            res.status(200).json({ message: 'Category updated successfully' });
        } catch (error) {
            console.error('Error editing category:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Delete a Category
    static async deleteCategory(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id } = req.params;
            await query('DELETE FROM retail_category WHERE id = ?', [id]);
            res.status(200).json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Add a Section
    static async addSection(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { name, retailShopId } = req.body;
            await query(
                'INSERT INTO retail_sections (name, retail_shop_id) VALUES (?, ?)',
                [name,retailShopId ]
            );
            res.status(200).json({ message: 'Section added successfully' });
        } catch (error) {
            console.error('Error adding section:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAllSections(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const retailShopId = req.params.retailShopId; // Get Retail Shop ID from URL
          const sections = await query(
            'SELECT * FROM retail_sections WHERE retail_shop_id = ?',
            [retailShopId]
          );
          res.status(200).json(sections);
        } catch (error) {
          console.error('Error fetching sections:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      

    // Edit a Section
    static async editSection(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id, name } = req.body;
            await query(
                'UPDATE retail_sections SET name = ? WHERE id = ?',
                [name, id]
            );
            res.status(200).json({ message: 'Section updated successfully' });
        } catch (error) {
            console.error('Error editing section:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Delete a Section
    static async deleteSection(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id } = req.params;
            await query('DELETE FROM retail_sections WHERE id = ?', [id]);
            res.status(200).json({ message: 'Section deleted successfully' });
        } catch (error) {
            console.error('Error deleting section:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Add a Product
    static async addProduct(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { name, description, price, barcode, skuCodeid, cgst, sgst, hsnCode, categoryId, retailShopId } = req.body;
            await query(
                'INSERT INTO retail_items (name, description, price, barcode, category_sku_id, cgst, sgst, hsn_code, category_id, retail_shop_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, description, price, barcode, skuCodeid, cgst, sgst, hsnCode, categoryId, retailShopId]
            );
            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            console.error('Error adding product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAllProducts(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const retailShopId = req.params.retailShopId; // Get Retail Shop ID from URL
          const products = await query(
            'SELECT * FROM retail_items WHERE retail_shop_id = ?',
            [retailShopId]
          );
          res.status(200).json(products);
        } catch (error) {
          console.error('Error fetching products:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      

    // Edit a Product
    static async editProduct(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id, name, description, price, barcode, skuCodeid, cgst, sgst, hsnCode,categoryId } = req.body;
            await query(
                'UPDATE retail_items SET name = ?, description = ?, price = ?, barcode = ?, category_sku_id = ?, cgst = ?, sgst = ?, hsn_code = ?, category_id = ? WHERE id = ?',
                [name, description, price, barcode,skuCodeid, cgst, sgst, hsnCode,categoryId, id]
            );
            res.status(200).json({ message: 'Product updated successfully' });
        } catch (error) {
            console.error('Error editing product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // Delete a Product
    static async deleteProduct(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { id } = req.params;
            await query('DELETE FROM retail_items WHERE id = ?', [id]);
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async mapSectionToCategory(req, res) {
        const query = util.promisify(db.query).bind(db);
    
        try {
            const { sectionId, categoryId } = req.body;
    
            // Validate input
            if (!sectionId || !categoryId) {
                return res.status(400).json({ error: "Both sectionId and categoryId are required." });
            }
    
            // Check if sectionId exists
            const sectionExists = await query(
                'SELECT COUNT(*) AS count FROM retail_sections WHERE id = ?',
                [sectionId]
            );
            if (sectionExists[0].count === 0) {
                return res.status(404).json({ error: `Section with ID ${sectionId} does not exist.` });
            }
    
            // Check if categoryId exists
            const categoryExists = await query(
                'SELECT COUNT(*) AS count FROM retail_category WHERE id = ?',
                [categoryId]
            );
            if (categoryExists[0].count === 0) {
                return res.status(404).json({ error: `Category with ID ${categoryId} does not exist.` });
            }
    
            // Check if mapping already exists
            const mappingExists = await query(
                'SELECT COUNT(*) AS count FROM retail_section_category_mapping WHERE section_id = ? AND category_id = ?',
                [sectionId, categoryId]
            );
            if (mappingExists[0].count > 0) {
                return res.status(409).json({ error: "This mapping already exists." });
            }
    
            // Insert mapping
            await query(
                'INSERT INTO retail_section_category_mapping (section_id, category_id) VALUES (?, ?)',
                [sectionId, categoryId]
            );
    
            return res.status(201).json({ message: "Section-Category mapping created successfully." });
        } catch (error) {
            console.error("Error creating section-category mapping:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }

    //retail sku
    static async addSkuCode(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const { skuCode, description, categoryId , retailShopId} = req.body; // SKU code, description, and category ID from the request body
      
          // Check if the SKU code already exists
          const skuExists = await query(`
            SELECT COUNT(*) AS count
            FROM category_sku
            WHERE sku_code = ?`, [skuCode]);
      
          if (skuExists[0].count > 0) {
            return res.status(400).json({ error: 'SKU code already exists' });
          }
      
          // Insert the new SKU code into the category_sku table
          const insertResult = await query(`
            INSERT INTO category_sku (sku_code, description, category_id,retail_shop_id)
            VALUES (?, ?, ? , ?)`, [skuCode, description, categoryId,retailShopId]);
      
          return res.status(201).json({
            message: 'SKU code added successfully',
            insertId: insertResult.insertId
          });
        } catch (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      
      static async editSkuCode(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const { skuId } = req.params; // SKU ID from the request URL
          const { skuCode, description, categoryId } = req.body; // SKU code, description, and category ID from the request body


          // // Check if the SKU code already exists
          // const skuExists = await query(`
          //   SELECT COUNT(*) AS count
          //   FROM category_sku
          //   WHERE sku_code = ?`, [skuCode]);
      
          // if (skuExists[0].count > 0) {
          //   return res.status(400).json({ error: 'SKU code already exists' });
          // }
      
          // Update the SKU code, description, and category ID
          const updateResult = await query(`
            UPDATE category_sku
            SET sku_code = ?, description = ?, category_id = ?
            WHERE id = ?`, [skuCode, description, categoryId, skuId]);
      
          return res.status(200).json({
            message: 'SKU code updated successfully',
            updateResult
          });
        } catch (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      
      static async deleteSkuCode(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const { skuId } = req.params;
      
          await query(`
            DELETE FROM category_sku
            WHERE id = ?`, [skuId]);
      
          return res.status(200).json({ message: 'SKU code deleted successfully' });
        } catch (error) {
          console.error('Error:', error);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      }


      static async getAllSku(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const retailShopId = req.params.retailShopId;
          const categories = await query(
            'SELECT * FROM category_sku WHERE retail_shop_id = ? ',
            [retailShopId]
          );
          res.status(200).json(categories);
        } catch (error) {
          console.error('Error fetching categories:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }

      // static async getItemsByCategory(req, res) {
      //   const query = util.promisify(db.query).bind(db);
      //   try {
      //     const { categoryId } = req.params;
      //     const { page = 1, limit = 20 } = req.query; // Default: Page 1, 20 items per page
      
      //     const offset = (page - 1) * limit; // Calculate offset
      
      //     const items = await query(`
      //       SELECT 
      //           ri.id AS item_id,
      //           ri.name AS item_name,
      //           ri.description AS item_description,
      //           ri.price AS item_price,
      //           ri.barcode AS item_barcode,
      //           ri.cgst AS item_cgst,
      //           ri.sgst AS item_sgst,
      //           ri.hsn_code AS item_hsn_code,
      //           ri.is_active AS item_is_active,
      //           ri.updated_on AS item_updated_on,
      //           cs.sku_code AS category_sku_code,
      //           cs.description AS sku_description
      //       FROM 
      //           retail_items ri
      //       JOIN 
      //           category_sku cs ON ri.category_sku_id = cs.id
      //       WHERE 
      //           cs.category_id = ?
      //       LIMIT ? OFFSET ?;
      //     `, [categoryId, parseInt(limit), parseInt(offset)]);
      
      //     return res.status(200).json({
      //       items,
      //       pagination: {
      //         currentPage: parseInt(page),
      //         itemsPerPage: parseInt(limit),
      //       },
      //     });
      //   } catch (error) {
      //     console.error('Error:', error);
      //     return res.status(500).json({ error: 'Internal Server Error' });
      //   }
      // }

      static async getItemsByCategory(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { categoryId } = req.params;
            const { page = 1, limit = 20 } = req.query; // Default: Page 1, 20 items per page
    
            const offset = (page - 1) * limit; // Calculate offset
    
            const items = await query(`
                SELECT 
                    ri.id AS item_id,
                    ri.name AS item_name,
                    ri.description AS item_description,
                    ri.price AS item_price,
                    ri.barcode AS item_barcode,
                    ri.cgst AS item_cgst,
                    ri.sgst AS item_sgst,
                    ri.hsn_code AS item_hsn_code,
                    ri.is_active AS item_is_active,
                    ri.updated_on AS item_updated_on,
                    cs.id AS category_sku_id,  -- Include SKU ID for debugging
                    cs.sku_code AS category_sku_code,
                    cs.description AS sku_description
                FROM 
                    retail_items ri
                LEFT JOIN 
                    category_sku cs ON ri.category_sku_id = cs.id
                WHERE 
                    ri.category_id = ?
                LIMIT ? OFFSET ?;
            `, [categoryId, parseInt(limit), parseInt(offset)]);
    
            return res.status(200).json({
                items,
                pagination: {
                    currentPage: parseInt(page),
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    

      static async getAllitemsbysku(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
          const skuid = req.params.skuid;
          const items = await query(
            'SELECT * FROM retail_items WHERE category_sku_id = ? ',
            [skuid]
          );
          res.status(200).json(items);
        } catch (error) {
          console.error('Error fetching categories:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
      

      static async getCategoriesBySection(req, res) {
        const query = util.promisify(db.query).bind(db);
        try {
            const { sectionId } = req.params;
    
            const categories = await query(`
                SELECT 
                    rc.id AS category_id, 
                    rc.name AS category_name
                FROM 
                    retail_category rc
                JOIN 
                    retail_section_category_mapping rscm ON rc.id = rscm.category_id
                WHERE 
                    rscm.section_id = ?;
            `, [sectionId]);
    
            return res.status(200).json({ categories });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    

    static async getitemsbybarcode(req, res) {
      const query = util.promisify(db.query).bind(db);
      try {
        const barcode = req.params.barcode;
        const retail_shop_id = req.params.retail_shop_id;
        const items = await query(
          'SELECT * FROM retail_items WHERE  barcode = ? AND retail_shop_id = ? ',
          [barcode,retail_shop_id]
        );
        res.status(200).json(items);
      } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
      
    
    // save items in cart
    static async addToCart(req, res) {
      const connection = await db.promise().getConnection(); 
    
      try {
        await connection.beginTransaction();
    
        const { 
          retail_shop_id, 
          user_id, 
          customer_id, 
          payment_mode, 
          total_amount, 
          total_discount, 
          taxable_amount, 
          total_cgst, 
          total_sgst, 
          grand_total, 
          items 
        } = req.body; 
    
        if (!items || items.length === 0) {
          return res.status(400).json({ error: 'No items provided' });
        }
    
        const order_no = `RT-${Date.now()}`;
    
        // Insert into retail_orders
        const [orderInsert] = await connection.query(
          `INSERT INTO retail_orders 
          (retail_shop_id, order_no, customer_id, user_id, total_amount, total_discount, 
           taxable_amount, total_cgst, total_sgst, grand_total, payment_mode, order_status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            retail_shop_id, order_no, customer_id, user_id, 
            total_amount, total_discount, taxable_amount, total_cgst, 
            total_sgst, grand_total, payment_mode, 'Ongoing'
          ]
        );
    
        const order_id = orderInsert.insertId;
    
        for (const item of items) {
          await connection.query(
            `INSERT INTO retail_order_items 
            (retail_shop_id, order_id, item_id, quantity, unit_price, discount_type,discounted_price, taxable_amount, cgst, sgst, total_price) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)`,
            [
              retail_shop_id, order_id, item.item_id, item.quantity, item.unit_price, 
              item.discount_type, item.discounted_price, 
              item.taxable_amount, item.cgst, item.sgst, item.total_price
            ]
          );
        }
    
        await connection.commit();
        return res.status(200).json({ 
          message: 'Order added to cart successfully', 
          order_id, 
          order_no 
        });
    
      } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      } finally {
        connection.release(); // Ensure connection is released
      }
    }
    
    // fetch cart items
    static async getOrderItems(req, res) {
      const query = util.promisify(db.query).bind(db);
  
      try {
        const { order_id } = req.params; // Get order ID from URL params
  
        if (!order_id) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
  
        // Fetch order details including customer_id
        const orderDetails = await query(`
          SELECT 
            ro.id AS order_id, 
            ro.customer_id, 
            ro.date, 
            ro.total_amount, 
            ro.total_discount, 
            ro.discount_type, 
            ro.total_cgst, 
            ro.total_sgst, 
            ro.payment_mode, 
            ro.via_cash, 
            ro.via_upi, 
            ro.via_card, 
            ro.payment_status, 
            ro.order_status,
            ro.order_no,
            c.name AS customer_name, 
            c.phone AS customer_phone
          FROM retail_orders ro
          LEFT JOIN retail_customers c ON ro.customer_id = c.id
          WHERE ro.id = ?
        `, [order_id]);
  
        if (orderDetails.length === 0) {
          return res.status(404).json({ message: 'Order not found' });
        }
  
        // Extract order & customer info
        const orderInfo = orderDetails[0];
        const customerDetails = orderInfo.customer_id
          ? {
              id: orderInfo.customer_id,
              name: orderInfo.customer_name,
              email: orderInfo.customer_email,
              phone: orderInfo.customer_phone
            }
          : null;
  
        // Fetch order items
        const orderItems = await query(`
          SELECT 
            roi.id AS order_item_id,
            roi.order_id,
            roi.item_id,
            ri.name AS item_name,
            ri.description,
            roi.quantity,
            roi.unit_price,
            roi.discount_type,
            roi.discount,
            roi.discounted_price,
            roi.taxable_amount,
            roi.cgst,
            roi.sgst,
            roi.total_price
          FROM retail_order_items roi
          JOIN retail_items ri ON roi.item_id = ri.id
          WHERE roi.order_id = ?
        `, [order_id]);
  
        return res.status(200).json({
          order_id: orderInfo.order_id,
          order_date: orderInfo.order_date,
          total_amount: orderInfo.total_amount,
          total_discount: orderInfo.total_discount,
          discount_type: orderInfo.discount_type,
          total_cgst: orderInfo.total_cgst,
          total_sgst: orderInfo.total_sgst,
          payment_mode: orderInfo.payment_mode,
          via_cash: orderInfo.via_cash,
          via_upi: orderInfo.via_upi,
          via_card: orderInfo.via_card,
          payment_status: orderInfo.payment_status,
          order_status: orderInfo.order_status,
          order_no:orderInfo.order_no,
          customer: customerDetails,
          items: orderItems
        });
  
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    } 
    

    //holds order
    static async holdOrder(req, res) {
      const query = util.promisify(db.query).bind(db);
      
      try {
        const { order_id, retail_shop_id,customer_name, customer_phone,GST_No } = req.body;
  
        if (!order_id ) {
          return res.status(400).json({ error: "Order ID is required" });
        }

         // Check if the phone number already exists
         const existingCustomer = await query(`
          SELECT id FROM retail_customers WHERE phone = ? AND retail_shop_id = ?
      `, [customer_phone, retail_shop_id]);
  
        // Insert customer into `retail_customers` table
        let customer_id;
        if (existingCustomer.length > 0) {
          const customerInsertResult = await query(`
            INSERT INTO retail_customers (name, phone, retail_shop_id, gst_number,customer_type)
            VALUES (?, ?, ?, ?,?)
        `, [customer_name, customer_phone, retail_shop_id, GST_No,'Repeat']);

        customer_id = customerInsertResult.insertId;
        } else {
            // Insert a new customer
            const customerInsertResult = await query(`
                INSERT INTO retail_customers (name, phone, retail_shop_id, gst_number)
                VALUES (?, ?, ?, ?)
            `, [customer_name, customer_phone, retail_shop_id, GST_No]);

            customer_id = customerInsertResult.insertId;
        }
  
        // Update `retail_orders` table to link customer and set order status to "Hold"
        await query(`
          UPDATE retail_orders
          SET customer_id = ?, order_status = ?
          WHERE id = ?
        `, [customer_id, 'Hold', order_id]);


        const existingOrder = await query(`
          SELECT order_id FROM retail_orders_hold WHERE order_id = ?
      `, [order_id]);
      
      if (existingOrder.length > 0) {
          // Update if order_id exists
          await query(`
              UPDATE retail_orders_hold
              SET retail_shop_id = ?, is_active = ?
              WHERE order_id = ?
          `, [retail_shop_id, 1, order_id]);
      } else {
          // Insert if order_id does not exist
          await query(`
              INSERT INTO retail_orders_hold (retail_shop_id, order_id, is_active)
              VALUES (?, ?, ?)
          `, [retail_shop_id, order_id, 1]);
      }
      

  
        return res.status(200).json({
          message: "Order held successfully",
          order_id,
          customer: {
            id: customer_id,
            name: customer_name,
            phone: customer_phone
          }
        });
  
      } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    }
    //fetch holds order 
    static async getholdsorder(req, res) {
      const query = util.promisify(db.query).bind(db);
      try {

        const { retail_shop_id } = req.params; 
        const items = await query("SELECT * FROM retail_orders_hold WHERE is_active = ?  AND retail_shop_id = ?", [1,retail_shop_id]);
    
        console.log("Fetched Items from DB:", items); // Debugging Output
    
        res.status(200).json({ data: items });
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    }


    static async updateIsActive(req, res) {
      const query = util.promisify(db.query).bind(db);
      const { id } = req.params; // Assuming id is passed as a URL parameter
      
      try {
        const result = await query(
          'UPDATE retail_orders_hold SET is_active = 0 WHERE id = ?',
          [id]
        );
    
        if (result.affectedRows > 0) {
          res.status(200).json({ message: 'Record updated successfully.' });
        } else {
          res.status(404).json({ message: 'Record not found.' });
        }
      } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
    

    //settle bill post api 
    static async updateOrderAndCustomer(req, res) {
      const query = util.promisify(db.query).bind(db);
  
      try {
        const {
          order_id,
          customer_name,
          gst_number,
          customer_phone,
          discount_type,
          total_discount,
          total_amount,
          total_cgst,
          total_sgst,
          payment_mode,
          via_cash,
          via_upi,
          via_card,
          retail_shop_id
        } = req.body;
  
        if (!order_id) {
          return res.status(400).json({ error: 'Order ID is required' });
        }
  
        // Check if order exists and fetch customer_id
        const orderResult = await query('SELECT customer_id FROM retail_orders WHERE id = ?', [order_id]);
  
        if (orderResult.length === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }
  
        let customer_id = orderResult[0].customer_id;
  
        if (customer_name || gst_number || customer_phone) {
        if (customer_id) {
          // Update existing customer details
          await query(
            'UPDATE retail_customers SET name = ?, gst_number = ?, phone = ?  WHERE id = ?',
            [customer_name, gst_number, customer_phone, customer_id]
          );
        } else {
          // Insert new customer
          const customerInsertResult = await query(
            'INSERT INTO retail_customers (name, gst_number, phone,retail_shop_id) VALUES (?, ?, ?,?)',
            [customer_name, gst_number, customer_phone,retail_shop_id]
          );
          customer_id = customerInsertResult.insertId;
  
          // Update retail_orders with new customer_id
          await query('UPDATE retail_orders SET customer_id = ? WHERE id = ?', [customer_id, order_id]);
        }
      }
  
        // Update order details
        await query(
          `UPDATE retail_orders 
           SET discount_type = ?, total_discount = ?, total_amount = ?, 
               total_cgst = ?, total_sgst = ?, payment_mode = ?, 
               via_cash = ?, via_upi = ?, via_card = ?, 
               payment_status = 'Paid', order_status = 'Completed'
           WHERE id = ?`,
          [
            discount_type, total_discount, total_amount,
            total_cgst, total_sgst, payment_mode,
            via_cash, via_upi, via_card,
            order_id
          ]
        );
  
        return res.status(200).json({
          message: 'Order and customer details updated successfully',
          order_id,
          customer: {
            id: customer_id,
            name: customer_name,
            email: gst_number,
            phone: customer_phone
          },
          order_status: 'Completed',
          payment_status: 'Paid'
        });
  
      } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  

    //recalculating in backend part 

    static async updateOrderItemDiscount(req, res) {
      const query = util.promisify(db.query).bind(db);
      try {
          const { order_item_id, discount_type, discount_value, order_id } = req.body;
  
          // Normalize discount_type to first letter capitalized
          const normalizedDiscountType = discount_type.charAt(0).toUpperCase() + discount_type.slice(1).toLowerCase();
  
          // Validate input
          if (discount_value < 0) {
              return res.status(400).json({ error: 'Discount value cannot be negative' });
          }
  
          // Get current item details
          const item = await query('SELECT * FROM retail_order_items WHERE id = ?', [order_item_id]);
          if (item.length === 0) {
              return res.status(404).json({ error: 'Order item not found' });
          }
  
          const { total_price, quantity, cgst, sgst } = item[0];
  
          let discountAmount = 0;
          if (normalizedDiscountType === 'Percentage') {
              // Ensure percentage doesn't exceed 100%
              discountAmount = Math.min(total_price * (discount_value / 100), total_price);
          } else if (normalizedDiscountType === 'Fixed') {
              // Ensure fixed discount doesn't exceed total price
              discountAmount = Math.min(discount_value, total_price);
          } else {
              return res.status(400).json({ error: 'Invalid discount type' });
          }
  
          const discountedPrice = total_price - discountAmount;
  
          // Update order item
          await query(
              'UPDATE retail_order_items SET discount_type = ?, discount = ?, discounted_price = ?, total_price = ? WHERE id = ?',
              [normalizedDiscountType, discountAmount, discountedPrice, discountedPrice, order_item_id]
          );
  
          // Recalculate totals for the retail_orders table
          await retailController.recalculateOrderTotals(order_id, query);
  
          res.json({ 
              message: 'Order item discount updated successfully',
              discountAmount: discountAmount,
              discountedPrice: discountedPrice
          });
  
      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  static async updateOrderItemQuantity(req, res) {
      const query = util.promisify(db.query).bind(db);
      try {
          const { order_item_id, new_quantity, order_id } = req.body;

          // Get current item details
          const item = await query('SELECT * FROM retail_order_items WHERE id = ?', [order_item_id]);
          if (item.length === 0) {
              return res.status(404).json({ error: 'Order item not found' });
          }

          const { discounted_price, cgst, sgst } = item[0];

          const newTotalPrice = discounted_price * new_quantity;

          // Update order item quantity
          await query(
              'UPDATE retail_order_items SET quantity = ?, total_price = ? WHERE id = ?',
              [new_quantity, newTotalPrice, order_item_id]
          );

          // Recalculate totals for the retail_orders table
          await retailController.recalculateOrderTotals(order_id, query);

          res.json({ message: 'Order item quantity updated successfully' });

      } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  static async recalculateOrderTotals(order_id, query) {
    try {
      // Fetch all order items
      const orderItems = await query(
        `SELECT quantity, unit_price, discount, discount_type, cgst, sgst 
         FROM retail_order_items WHERE order_id = ?`, 
        [order_id]
      );

      if (orderItems.length === 0) return; // No items, no need to update totals

      let total_amount = 0;
      let total_discount = 0;
      let total_cgst = 0;
      let total_sgst = 0;
      let totalorderitemscgst = 0;
      let totalorderitemssgst = 0;

      // Calculate totals
      orderItems.forEach(item => {
        let item_total = parseFloat(item.quantity) * parseFloat(item.unit_price);

        let discount_value = 0;
        if (item.discount_type === 'Percentage') {
          discount_value = (item_total * parseFloat(item.discount)) / 100;
        } else if (item.discount_type === 'Fixed') {
          discount_value = parseFloat(item.discount);
        }

        let discounted_price = item_total - discount_value;

        total_amount += discounted_price;
        total_discount += discount_value;
        totalorderitemscgst += parseFloat(item.cgst);
        totalorderitemssgst += parseFloat(item.sgst);
      });

      // Avoid division by zero
      let taxRate = totalorderitemscgst + totalorderitemssgst;
      let taxable_amount = taxRate !== 0 ? total_amount / (1 + (taxRate / 100)) : total_amount;

      // Ensure values are numbers
      taxable_amount = isNaN(taxable_amount) ? 0 : taxable_amount;
      total_cgst = isNaN(total_cgst) ? 0 : taxable_amount * (totalorderitemscgst / 100);
      total_sgst = isNaN(total_sgst) ? 0 : taxable_amount * (totalorderitemssgst / 100);
      let grand_total = taxable_amount + total_cgst + total_sgst;

      // Ensure all values are properly formatted numbers
      total_amount = parseFloat(total_amount.toFixed(2));
      total_discount = parseFloat(total_discount.toFixed(2));
      taxable_amount = parseFloat(taxable_amount.toFixed(2));
      total_cgst = parseFloat(total_cgst.toFixed(2));
      total_sgst = parseFloat(total_sgst.toFixed(2));
      grand_total = parseFloat(grand_total.toFixed(2));

      // Update the retail_orders table
      await query(
        `UPDATE retail_orders 
         SET total_amount = ?, total_discount = ?, taxable_amount = ?, 
             total_cgst = ?, total_sgst = ?, grand_total = ? 
         WHERE id = ?`,
        [total_amount, total_discount, taxable_amount, total_cgst, total_sgst, grand_total, order_id]
      );

    } catch (error) {
      console.error('Error recalculating order totals:', error);
    }
  }

  static async deleteOrderItem(req, res) {
    const query = util.promisify(db.query).bind(db);
    try {
        const { order_item_id, order_id } = req.body;

        // Get the order item details before deleting
        const item = await query('SELECT * FROM retail_order_items WHERE id = ?', [order_item_id]);
        if (item.length === 0) {
            return res.status(404).json({ error: 'Order item not found' });
        }

        // Delete the order item
        await query('DELETE FROM retail_order_items WHERE id = ?', [order_item_id]);

        // Recalculate totals for the order
        await retailController.recalculateOrderTotals(order_id, query);

        res.json({ message: 'Order item deleted and order totals updated successfully' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

static async addOrderItem(req, res) {
  const query = util.promisify(db.query).bind(db);
  try {
    const { order_id,retail_shop_id, items } = req.body; // Expecting an array of items

    if (!order_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid request, missing required fields' });
    }

    const insertValues = [];
    
    items.forEach(item => {
        const { product_id, quantity, unit_price, discount_type, discount_value, cgst, sgst } = item;

        if (!product_id || !quantity || !unit_price) {
            throw new Error(`Missing required fields for product_id: ${product_id}`);
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount_type === 'Percentage') {
            discountAmount = (unit_price * discount_value) / 100;
        } else if (discount_type === 'Fixed') {
            discountAmount = discount_value;
        }

        // Calculate final price
        const discountedPrice = Math.max(unit_price - discountAmount, 0);
        const totalPrice = discountedPrice * quantity;

        // Prepare values for bulk insert
        insertValues.push([order_id, product_id, quantity, unit_price, discount_type, discountAmount, discountedPrice, totalPrice, cgst, sgst,retail_shop_id]);
    });

    // Insert multiple order items at once
    await query(
        `INSERT INTO retail_order_items 
         (order_id, item_id, quantity, unit_price, discount_type, discount, discounted_price, total_price, cgst, sgst,retail_shop_id) 
         VALUES ?`,
        [insertValues]
    );

    // Recalculate totals for the order
    await retailController.recalculateOrderTotals(order_id, query);

    res.json({ message: 'Multiple order items added successfully and order totals updated' });

} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
}


    
}


export { retailController };