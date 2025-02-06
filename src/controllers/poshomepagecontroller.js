import db from '../config/db.js';

class RestaurantDataController {
  static getRestaurantData(req, res) {
    const { restaurantId } = req.body;
    db.query(`
      SELECT 
          r.id AS restaurant_id,
          r.name AS restaurant_name,
          r.gst_no AS gst_no,
          rs.id AS section_id,
          be.email,
          be.contact_no,
          be.address,
          rs.name AS section_name,
          rs.description AS section_description,
          rs.max_table_capacity,
          rs.no_of_tables,
          t.id AS table_id,
          t.label AS table_label,
          t.section_id AS table_section_id,
          mc.id AS menu_category_id,
          mc.name AS menu_category_name,
          mc.description AS menu_category_description,
          mc.is_active AS menu_category_is_active,
          mc.updated_on AS menu_category_updated_on,
          mi.id AS menu_item_id,
          mi.name AS menu_item_name,
          mi.description AS menu_item_description,
          mi.type AS menu_item_type,
          mi.cgst AS menu_item_cgst,
          mi.sgst AS menu_item_sgst,
          mi.code AS menu_item_code,
          mi.price AS menu_item_price,
          mi.image AS menu_item_image,
          mi.is_active AS menu_item_is_active,
          mi.updated_on AS menu_item_updated_on,
          p.id AS payment_id,
          p.type AS payment_type,
          p.is_active AS payment_is_active,
          -- New fields for out-of-stock check
          rmi.recipe_id AS recipe_id,
          mi_ingredient.id AS ingredient_id,
          mi_ingredient.calculated_position AS calculated_position,
          mi_ingredient.threshold AS threshold,
          -- Advanced inventory check
          CASE 
              WHEN bep.product_id IS NOT NULL THEN 1
              ELSE 0
          END AS hasInventory
      FROM 
          restaurants r
      LEFT JOIN 
          restaurant_sections rs ON r.id = rs.restaurant_id
      LEFT JOIN 
          business_entity be ON r.id = be.business_entity_id
      LEFT JOIN 
          tables t ON rs.id = t.section_id
      LEFT JOIN 
          menu_category mc ON r.id = mc.restaurant_id
      LEFT JOIN 
          menu_items mi ON mc.id = mi.menu_category_id AND r.id = mi.restaurant_id
      LEFT JOIN 
          recipe_menu_ingredient rmi ON rmi.recipe_id = mi.recipe_id
      LEFT JOIN 
          menu_ingredients mi_ingredient ON rmi.menu_ingredient_id = mi_ingredient.id
      LEFT JOIN 
          payment_methods p ON r.id = p.restaurant_id
      LEFT JOIN 
          business_entity_product_mapping bep ON r.id = bep.business_entity_id AND bep.product_id = 3
      WHERE 
          r.id = ?
    `, [restaurantId], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const formattedData = formatData(results);
        res.json(formattedData);
      }
    });




  }
  static getRestaurantTables(req, res) {
    const { restaurantId } = req.body;

    // Fetch tables
    db.query(`
      SELECT *
      FROM 
          tables t
      WHERE 
          t.restaurant_id = ?
    `, [restaurantId], (err, tables) => {
      if (err) {
        console.error('Error querying MySQL for tables:', err);
        console.error('Failed SQL query:', 'GET TABLES');
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      // Fetch sections
      db.query(`
          SELECT *
          FROM 
              restaurant_sections s
          WHERE 
              s.restaurant_id = ?
        `, [restaurantId], (err, sections) => {
        if (err) {
          console.error('Error querying MySQL for sections:', err);
          console.error('Failed SQL query:', 'GET SECTIONS');
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        // Fetch orders
        db.query(`
              SELECT  o.id AS oid,o.*
              FROM 
                  orders o
              JOIN
                  tables t ON o.table_no = t.id
              WHERE 
                  t.restaurant_id = ? AND o.order_status = 'Running'
            `, [restaurantId], (err, orders) => {
          if (err) {
            console.error('Error querying MySQL for orders:', err);
            console.error('Failed SQL query:', 'GET ORDERS');
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          // Fetch waiters
          db.query(`
          SELECT *
          FROM users w
          LEFT JOIN user_business_entity_role_mapping uberm ON uberm.user_id = w.id 
          WHERE  uberm.role = ? AND business_entity_id = ? ;
          
            `, [4, restaurantId], (err, waiters) => {
            if (err) {
              console.error('Error querying MySQL for waiters:', err);
              console.error('Failed SQL query:', 'GET WAITERS');
              res.status(500).json({ error: 'Internal Server Error' });
              return;
            }

            // Fetch order details based on order IDs
            const orderIds = orders.map(order => order.id);
            if (orders.length === 0) {
              console.log('No orders found.');
              const formattedData = formatDataTables(tables, sections, orders, []);
              res.json(formattedData);
              return;
            }

            db.query(`
                  SELECT od.*, mi.name AS menu_item_name, mi.cgst,mi.sgst
                  FROM 
                      order_details od
                  JOIN
                      menu_items mi ON od.menu_item_id = mi.id
                      WHERE od.isCancelled=0
                  
                `, [orderIds], (err, orderDetails) => {
              if (err) {
                console.error('Error querying MySQL for order details:', err);
                console.error('Failed SQL query:', 'GET ORDER DETAILS');
                res.status(500).json({ error: 'Internal Server Error' });
                return;
              }

              // Format data including tables, sections, orders, order details, and waiters
              const formattedData = formatDataTables(tables, sections, orders, orderDetails, waiters);
              res.json(formattedData);
            });
          });
        });
      });
    });
  }

  static getTakeAwayOrders(req, res) {
    const { restaurantId } = req.body;
    const query = `
      SELECT 
        o.id AS orderId, 
        o.order_id AS restoOrderId,
        o.order_status, 
        o.type,
        o.date,
        o.time,
        o.amount,
        o.cgst,
        o.sgst,
        o.grand_total,
        o.payment_mode,
        o.payment_status,
        od.id AS orderDetailId,
        od.kot_id,
        mi.name AS itemName,
        mi.cgst AS menu_item_cgst,
        mi.sgst AS menu_item_sgst,
        od.quantity,
        od.instruction,
        od.price
      FROM orders o
      JOIN order_details od ON o.id = od.order_id
      JOIN menu_items mi ON od.menu_item_id = mi.id
      WHERE o.restaurant_id = ? AND o.order_status = 'Running' AND o.type = 'TakeAway'
    `;

    db.query(query, [restaurantId], (err, results) => {
      if (err) {
        console.error('Error querying MySQL for takeaway orders:', err);
        console.error('Failed SQL query:', 'GET TAKEAWAY ORDERS');
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const ordersMap = new Map();
      results.forEach(row => {
        const orderId = row.orderId;
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            id: row.orderId,
            restoOrderId: row.restoOrderId,
            order_status: row.order_status,
            type: row.type,
            date: row.date,
            time: row.time,
            amount: row.grand_total,
            subtotal: row.amount,
            cgst: row.cgst,
            sgst: row.sgst,
            payment_mode: row.payment_mode,
            payment_status: row.payment_status,
            items: []
          });
        }
        ordersMap.get(orderId).items.push({
          orderDetailId: row.orderDetailId,
          itemName: row.itemName,
          quantity: row.quantity,
          price: row.price,
          kot_id: row.kot_id,
          menu_item_cgst: row.menu_item_cgst,
          menu_item_sgst: row.menu_item_sgst,
          instruction: row.instruction
        });
      });


      const formattedOrders = Array.from(ordersMap.values());

      res.json(formattedOrders);
    });
  }




  static insertOrderDetails(req, res) {
    const { amount, cgst, sgst, grandtotal, orderDetails, restaurantId } = req.body;

    db.query(`
      SELECT *
      FROM orders
      WHERE id = ? AND restaurant_id = ?
  `, [req.body.orderId, restaurantId], (err, orderResult) => {
      if (err) {
        console.error('Error querying MySQL for order:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      if (orderResult.length === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const order = orderResult[0];


      const newAmount = parseFloat(order.amount) + parseFloat(amount);
      const newCgst = parseFloat(order.cgst) + parseFloat(cgst);
      const newSgst = parseFloat(order.sgst) + parseFloat(sgst);
      const newGrandtotal = parseFloat(order.grand_total) + parseFloat(grandtotal);


      // Update orders table
      db.query(`
          UPDATE orders
          SET amount = ?, cgst = ?, sgst = ?, grand_total = ?
          WHERE id = ? AND restaurant_id = ?
      `, [newAmount, newCgst, newSgst, newGrandtotal, req.body.orderId, restaurantId], (err, updateResult) => {
        if (err) {
          console.error('Error updating orders table:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        // Retrieve max kot_id from order_details
        db.query(`
              SELECT MAX(kot_id) AS max_kot_id
              FROM order_details
              WHERE restaurant_id = ?
          `, [restaurantId], (err, maxKotIdResult) => {
          if (err) {
            console.error('Error querying MySQL for max kot_id:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          const maxKotId = maxKotIdResult[0].max_kot_id || 0;
          const nextKotId = maxKotId + 1;

          // Insert order details
          const values = orderDetails.map(detail => [
            req.body.orderId,
            nextKotId,
            detail.id,
            detail.menu_item_id,
            detail.quantity,
            detail.price,
            detail.instruction,
            new Date(),
            restaurantId,
            0
          ]);

          db.query(`
                  INSERT INTO order_details (order_id, kot_id, id, menu_item_id, quantity, price, instruction, updated_on, restaurant_id,isCancelled)
                  VALUES ?
              `, [values], (err, insertResult) => {
            if (err) {
              console.error('Error inserting order details:', err);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
            }

            res.json({ success: true, message: 'Order details inserted successfully' });
          });
        });
      });
    });
  }
  static insertNewOrder(req, res) {
    const { restaurantId, orderInfos, orderDetails } = req.body;

    db.query(`
        SELECT MAX(order_id) AS max_order_id
        FROM orders
        WHERE restaurant_id = ?
    `, [restaurantId], (err, result) => {
      if (err) {
        console.error('Error querying MySQL for max order ID:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }


      let maxOrderId = result[0].max_order_id || 0;
      console.log(typeof maxOrderId);
      var newId = parseInt(maxOrderId) + 1;
      console.log('Next Order ID:', newId);

      // Insert new order with the retrieved maxOrderId
      db.query(`
            INSERT INTO orders (order_id, date, time, type, table_no, token_no, amount, cgst, sgst, parcel_charges, delivery_charges, other_charges, via_cash,via_card,via_upi,via_other,grand_total, payment_mode, customer_id, head_count, waiter_id, order_status, payment_status, updated_by, updated_on, cancellation_reason, restaurant_id)
            VALUES (?, ?, ?, ?, ?, ?,?,?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [newId, orderInfos.date, orderInfos.time, orderInfos.type, orderInfos.table_no, orderInfos.token_no, orderInfos.amount, orderInfos.cgst, orderInfos.sgst, orderInfos.parcel_charges, orderInfos.delivery_charges, orderInfos.other_charges, orderInfos.via_cash ?? 0, orderInfos.via_card ?? 0, orderInfos.via_upi ?? 0, orderInfos.via_other ?? 0, orderInfos.grand_total, orderInfos.payment_mode, orderInfos.customer_id, orderInfos.head_count, orderInfos.waiter_id, orderInfos.order_status, orderInfos.payment_status, orderInfos.updated_by, new Date(), orderInfos.cancellation_reason, restaurantId], (err, result) => {
        if (err) {
          console.error('Error inserting new record into orders table:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        // Get the last insert ID 
        const orderId = result.insertId;

        // Update table status
        db.query(`
                UPDATE tables
                SET status = ?
                WHERE id = ?
            `, ['Occupied', orderInfos.table_no], (err, result) => {
          if (err) {
            console.error('Error updating table status:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          // Get the max kot_id from order_details table
          db.query(`
                    SELECT MAX(kot_id) AS max_kot_id
                    FROM order_details
                    WHERE restaurant_id = ?
                `, [restaurantId], (err, result) => {
            if (err) {
              console.error('Error querying MySQL for max kot ID:', err);
              res.status(500).json({ error: 'Internal Server Error' });
              return;
            }

            let maxKotId = parseInt(result[0].max_kot_id) || 0;
            maxKotId++;

            // Insert new order details
            const values = orderDetails.map(detail => [
              orderId,
              maxKotId,
              detail.menu_item_id,
              detail.quantity,
              detail.price,
              detail.instruction,
              new Date(),
              restaurantId, 0
            ]);

            db.query(`
                        INSERT INTO order_details (order_id, kot_id, menu_item_id, quantity, price, instruction, updated_on, restaurant_id,isCancelled)
                        VALUES ?
                    `, [values], (err, result) => {
              if (err) {
                console.error('Error inserting order details:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
              }

              res.json({ success: true, message: 'Order details inserted successfully' });
            });
          });
        });
      });
    });
  }


  static settleOrder(req, res) {
    const { restaurantId, orderId, orderInfos } = req.body;

    if (!orderInfos || Object.keys(orderInfos).length === 0) {
      return res.status(400).json({ error: 'No data received in orderInfos' });
    }

    const {
      payment_mode = null,
      customer_id = null,
      customer_name = null,
      customer_phone = null,
      head_count = null,
      waiter_id = null,
      order_status = null,
      payment_status = null,
      table_no = null,
      via_card = null,
      via_cash = null,
      via_upi = null,
      grand_total = null
    } = orderInfos;



    const handleCustomer = () =>
      new Promise((resolve, reject) => {
        if (customer_phone !== null) {
          const query = `
                  INSERT INTO customer_table (first_name, phone, restaurant_id)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                      first_name = COALESCE(?, first_name),
                      phone = COALESCE(?, phone)
              `;
          db.query(query, [
            customer_name, customer_phone, restaurantId,
            customer_name, customer_phone
          ], (err, result) => {
            if (err) {
              console.error('Error inserting or updating customer:', err);
              return reject('Internal Server Error');
            }


            if (result.insertId) {
              resolve(result.insertId);
            } else {
              db.query(`
                          SELECT id FROM customer_table WHERE phone = ? AND restaurant_id = ?
                      `, [customer_phone, restaurantId], (err, rows) => {
                if (err) {
                  console.error('Error fetching customer ID:', err);
                  return reject('Internal Server Error');
                }
                resolve(rows[0]?.id || null);
              });
            }
          });
        } else {
          resolve(customer_id);
        }
      });

    handleCustomer()
      .then((customerId) => {
        db.query(`
              UPDATE orders
              SET 
                  payment_mode = COALESCE(?, payment_mode),
                  customer_id = COALESCE(?, customer_id),
                  head_count = COALESCE(?, head_count),
                  waiter_id = COALESCE(?, waiter_id),
                  order_status = COALESCE(?, order_status),
                  payment_status = COALESCE(?, payment_status),
                  grand_total = COALESCE(?, grand_total),
                  via_cash = COALESCE(?, via_cash),
                  via_upi = COALESCE(?, via_upi),
                  via_card = COALESCE(?, via_card)
              WHERE id = ?
                AND restaurant_id = ?
          `, [
          payment_mode, customerId, head_count, waiter_id, order_status,
          payment_status, grand_total, via_cash, via_upi, via_card, orderId, restaurantId
        ], (err, result) => {
          if (err) {
            console.error('Error updating order record in orders table:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }

          // Update table status if table_no is provided
          if (table_no !== null) {
            db.query(`
                      UPDATE tables
                      SET status = 'Available'
                      WHERE id = ?
                        AND restaurant_id = ?
                  `, [table_no, restaurantId], (err) => {
              if (err) {
                console.error('Error updating table status:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
              }
            });
          }
          // Only perform inventory manipulations if the order status is "Completed"
          if (order_status === "Completed") {
            const fetchOrderDetailsQuery = `
              SELECT od.menu_item_id, od.quantity, mi.recipe_id 
              FROM order_details od
              JOIN menu_items mi ON od.menu_item_id = mi.id
              WHERE od.order_id = ? 
                AND od.restaurant_id = ? 
                AND od.isCancelled = 0
          `;

            db.query(fetchOrderDetailsQuery, [orderId, restaurantId], (err, orderDetails) => {
              if (err) {
                console.error('Error fetching order details:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
              }

              const updateIngredients = (index = 0) => {
                if (index >= orderDetails.length) {
                  return res.json({ success: true, message: 'Order settled successfully' });
                }

                const { quantity, recipe_id } = orderDetails[index];

                const fetchIngredientsQuery = `
                      SELECT rmi.menu_ingredient_id, rmi.unit_id AS recipe_unit, rmi.quantity AS recipe_quantity, mi.unit_id AS ingredient_unit
                      FROM recipe_menu_ingredient rmi
                      JOIN menu_ingredients mi ON rmi.menu_ingredient_id = mi.id
                      WHERE rmi.recipe_id = ?
                        AND rmi.restaurant_id = ?
                  `;

                db.query(fetchIngredientsQuery, [recipe_id, restaurantId], (err, ingredients) => {
                  if (err) {
                    console.error('Error fetching recipe ingredients:', err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                  }

                  const processIngredients = (i = 0) => {
                    if (i >= ingredients.length) {
                      return updateIngredients(index + 1);
                    }

                    const { menu_ingredient_id, recipe_unit, recipe_quantity, ingredient_unit } = ingredients[i];
                    let finalQuantity = quantity * recipe_quantity;//menu item qty and ingredient qty

                    // Log to track quantity before and after conversion
                    console.log(`Processing ingredient ${menu_ingredient_id}, initial quantity: ${finalQuantity}`);

                    if (recipe_unit !== ingredient_unit) {
                      const conversionQuery = `
                                  SELECT conversion_rate 
                                  FROM unit_conversion 
                                  WHERE from_unit_id = ? 
                                    AND to_unit_id = ?
                              `;
                      db.query(conversionQuery, [ingredient_unit, recipe_unit], (err, conversionResult) => {
                        if (err) {
                          console.error('Error fetching unit conversion:', err);
                          return res.status(500).json({ error: 'Internal Server Error' });
                        }

                        if (conversionResult.length > 0) {
                          const conversionRate = conversionResult[0].conversion_rate;
                          finalQuantity /= conversionRate;

                          console.log(`Converted quantity for ingredient ${menu_ingredient_id}: ${finalQuantity}`);
                        } else {
                          console.warn(`No conversion rate found for recipe_unit ${recipe_unit} and ingredient_unit ${ingredient_unit}`);
                        }

                        const deductStockQuery = `
                                      UPDATE menu_ingredients 
                                      SET calculated_position = calculated_position - ?
                                      WHERE id = ?
                                        AND restaurant_id = ?
                                  `;
                        db.query(deductStockQuery, [finalQuantity, menu_ingredient_id, restaurantId], (err, result) => {
                          if (err) {
                            console.error('Error deducting ingredient stock:', err);
                            return res.status(500).json({ error: 'Internal Server Error' });
                          }
                          processIngredients(i + 1);
                        });
                      });
                    } else {
                      const deductStockQuery = `
                                  UPDATE menu_ingredients 
                                  SET calculated_position = calculated_position - ?
                                  WHERE id = ?
                                    AND restaurant_id = ?
                              `;
                      db.query(deductStockQuery, [finalQuantity, menu_ingredient_id, restaurantId], (err, result) => {
                        if (err) {
                          console.error('Error deducting ingredient stock:', err);
                          return res.status(500).json({ error: 'Internal Server Error' });
                        }
                        processIngredients(i + 1);
                      });
                    }
                  };

                  processIngredients();
                });
              };

              updateIngredients();
            });
          } else {
            return res.json({ success: true, message: 'Order updated without inventory manipulation' });
          }
        });
      })
      .catch((error) => {
        console.error('Error handling customer logic:', error);
        res.status(500).json({ error });
      });
  }



  static switchTable(req, res) {
    const { restaurantId, orderId, currentTableId, newTableId } = req.body;
    db.query(
      `
        UPDATE orders
        SET 
          table_no = ?
        WHERE id = ?
          AND restaurant_id = ?
      `,
      [newTableId, orderId, restaurantId],
      (err, result) => {
        if (err) {
          console.error('Error updating to new table in orders table:', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        // Update table status of old table and new table
        if (currentTableId !== null && newTableId !== null) {
          db.query(
            `
              UPDATE tables
              SET status = 
                CASE
                  WHEN id = ? THEN 'Available'
                  WHEN id = ? THEN 'Occupied'
                  ELSE status
                END
              WHERE (id = ? OR id = ?) AND restaurant_id = ?
            `,
            [currentTableId, newTableId, currentTableId, newTableId, restaurantId],
            (err, result) => {
              if (err) {
                console.error('Error updating table statuses:', err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
              }
              res.json({ success: true, message: 'Order Tables Switched Successfully' });
            }
          );
        } else {
          res.json({ success: true, message: 'Tables Switched successfully' });
        }
      }
    );
  }

  static updateKOT(req, res) {
    const { restaurantId, status, kotId, menuId, reason, grandtotal, cgst, sgst, subtotal, orderid, order_status, qty, tableId } = req.body;
    if (status === '1') {
      db.query(
        `
        UPDATE order_details
        SET 
          isCancelled = 1, 
          cancelled_at = now(), 
          cancellation_reason = ?
        WHERE 
          kot_id = ? 
          AND menu_item_id = ?
          AND restaurant_id = ?
        `,
        [reason, kotId, menuId, restaurantId],
        (err, result) => {
          if (err) {
            console.error('Error removing kot:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.json({ success: true, message: 'KOT REMOVED successfully' });
          }
        }
      );
    } else if (status === '2') {
      //only update such that if it is cancelled the existing grandtotals etc are not overwritten with 0
      db.query(
        `
        UPDATE orders
        SET 
          grand_total = CASE WHEN ? != 0 THEN ? ELSE grand_total END, 
          cgst = CASE WHEN ? != 0 THEN ? ELSE cgst END, 
          sgst = CASE WHEN ? != 0 THEN ? ELSE sgst END, 
          amount = CASE WHEN ? != 0 THEN ? ELSE amount END, 
          order_status = ?
        WHERE 
          id = ? 
          AND restaurant_id = ?
        `,
        [grandtotal, grandtotal, grandtotal, cgst, grandtotal, sgst, grandtotal, subtotal, order_status, orderid, restaurantId],
        (err, result) => {
          if (err) {
            console.error('Error updating order:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            if (order_status == 'Cancelled') {
              db.query(
                `
                        UPDATE tables
                        SET status = 
                            CASE 
                                WHEN ? = 'Cancelled' THEN 'Available'
                                ELSE 'Occupied'
                            END
                        WHERE id = ?  AND restaurant_id = ?
                        `,
                [order_status, tableId, restaurantId],
                (err, result) => {
                  if (err) {
                    console.error('Error updating table status:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                  }
                }
              );
            }
            res.json({ success: true, message: 'Order updated successfully' });
          }
        }
      );


    }
    else if (status === '3') {
      db.query(
        `
        UPDATE order_details
        SET 
          quantity = ?,  
          cancellation_reason = ?
        WHERE 
          kot_id = ? 
          AND menu_item_id = ?
          AND restaurant_id = ?
        `,
        [qty, reason, kotId, menuId, restaurantId],
        (err, result) => {
          if (err) {
            console.error('Error updating order:', err);
            res.status(500).json({ error: 'Internal Server Error' });
          } else {
            res.json({ success: true, message: 'Order updated successfully' });

          }
        }
      );
    }
    else {
      res.status(400).json({ error: 'Invalid status value' });
    }
  }

  static async openDay(req, res) {
    const { restaurantId, openDate, openTime, initialCashDrawer } = req.body;

    if (!restaurantId || !openDate || !openTime || !initialCashDrawer) {
      return res.status(400).json({ error: 'Restaurant ID, open date, open time, and initial cash drawer amount are required' });
    }

    const parsedInitialCashDrawer = parseFloat(initialCashDrawer);

    if (isNaN(parsedInitialCashDrawer)) {
      return res.status(400).json({ error: 'Initial cash drawer amount must be a valid number' });
    }

    // Query to check if a day is already opened for the given date
    const checkQuery = `
      SELECT id FROM day_operations 
      WHERE restaurant_id = ? AND date = ?
    `;

    db.query(checkQuery, [restaurantId, openDate], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error checking day operations:', checkErr);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (checkResults.length > 0) {
        return res.json({ error: 'Day was already opened for this date', code: 'DQ1' });
      }


      const insertQuery = `
        INSERT INTO day_operations (restaurant_id, open_date, date, open_time, initial_cash_drawer)
        VALUES (?, ?, ?, ?, ?)
      `;

      const values = [restaurantId, openDate, openDate, openTime, parsedInitialCashDrawer];

      db.query(insertQuery, values, (insertErr, insertResults) => {
        if (insertErr) {
          console.error('Error opening day:', insertErr);
          return res.status(500).json({ error: 'Internal Server Error' });
        } else {
          return res.json({ code: "DQ0", message: 'Day opened successfully', results: insertResults });
        }
      });
    });
  }


  static async closeDay(req, res) {
    const { restaurantId, date, closeDate, closeTime, totalDrawerCash, totalCashAmount, reason } = req.body;

    if (!restaurantId || !date || !closeDate || !closeTime) {
      return res.status(400).json({ error: 'Restaurant ID, date, close date, and close time are required' });
    }

    const parsedTotalDrawerCash = parseFloat(totalDrawerCash);
    const parsedTotalCashAmount = parseFloat(totalCashAmount);

    if (isNaN(parsedTotalDrawerCash) || isNaN(parsedTotalCashAmount)) {
      return res.status(400).json({ error: 'Total drawer cash and total cash amount must be valid numbers' });
    }

    const query = `
      UPDATE day_operations
      SET close_date = ?, close_time = ?, is_closed = true, total_drawer_cash = ?, total_cash_amount = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE restaurant_id = ? AND date = ? AND is_closed = false
    `;

    const values = [closeDate, closeTime, parsedTotalDrawerCash, parsedTotalCashAmount, reason, restaurantId, date];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error closing day:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ error: 'No open day found for the specified date' });
      } else {
        res.json({ message: 'Day closed successfully', results });
      }
    });
  }

  static async isDayClosed(req, res) {
    const { restaurantId, date } = req.body;

    if (!restaurantId || !date) {
      return res.status(400).json({ error: 'Restaurant ID and date are required' });
    }

    const query = 'SELECT is_closed FROM day_operations WHERE restaurant_id = ? AND date = ? AND is_closed = ?';

    db.query(query, [restaurantId, date, 0], (err, results) => {
      if (err) {
        console.error('Error querying day operations:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        const isClosed = results.length > 0 ? results[0].is_closed === 0 ? false : true : false;
        res.json({ "num_rows": results.length, date, isClosed });
      }
    });
  }

  static getInventory(req, res) {
    const { restaurantId } = req.body;
    const query = `
   SELECT 
    mi.id,
    mi.last_updated_time AS lastUpdated,
    mi.ingredient_name AS itemName,
    mi.calculated_position AS currentStock,
    mi.threshold,
    mi.last_updated_position AS originalStock,
    u.unit_name AS unit,

    
    COUNT(DISTINCT CASE 
        WHEN od.order_id IS NOT NULL 
             AND od.isCancelled = 0
             AND (
                 o.updated_on >= mi.last_purchase_date
             )
        THEN od.order_id 
    END) AS totalOrders
FROM 
    menu_ingredients mi
LEFT JOIN 
    unit u ON mi.unit_id = u.id
LEFT JOIN 
    recipe_menu_ingredient rmi ON mi.id = rmi.menu_ingredient_id
LEFT JOIN 
    menu_items m ON rmi.recipe_id = m.recipe_id
LEFT JOIN 
    order_details od ON m.id = od.menu_item_id
LEFT JOIN 
    orders o ON od.order_id = o.id
WHERE 
    mi.restaurant_id = ?
GROUP BY 
    mi.id, mi.last_updated_time, mi.ingredient_name, 
    mi.calculated_position, mi.threshold, mi.last_updated_position, u.unit_name;

    `;

    db.query(query, [restaurantId], (err, results) => {
      if (err) {
        console.error('Error querying MySQL for inventory:', err);
        console.error('Failed SQL query:', query);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      res.status(200).json(results);
    });
  }





}

// function formatData(results) {
//   const formattedData = {
//     info: {
//       restaurant_id: null,
//       restaurant_name: null,
//       gst_no:null,
//       address:null,
//       email:null,
//       contact:null
//     },
//     data: {
//       sections: [],
//       menu_categories: [],
//       menu_items: [],
//       tables: [],
//       payments: []
//     }
//   };

//   const sectionMap = new Map();
//   const menuCategoryMap = new Map();

//   for (const row of results) {

//     if (!formattedData.info.restaurant_id) {
//       formattedData.info.restaurant_id = row.restaurant_id;
//       formattedData.info.restaurant_name = row.restaurant_name;
//       formattedData.info.gst_no = row.gst_no;
//       formattedData.info.address=row.address,
//       formattedData.info.email=row.email,
//       formattedData.info.contact=row.contact_no
//     }

//     const sectionId = row.section_id;
//     let section = sectionMap.get(sectionId);
//     if (!section) {
//       section = {
//         id: sectionId,
//         name: row.section_name,
//         description: row.section_description,
//         max_table_capacity: row.max_table_capacity,
//         no_of_tables: row.no_of_tables,
//         tables: []
//       };
//       sectionMap.set(sectionId, section);
//       formattedData.data.sections.push(section);
//     }


//     const tableId = row.table_id;
//     if (tableId !== null) {
//       if (!section.tables.some(table => table.id === tableId)) {
//         section.tables.push({
//           id: tableId,
//           label: row.table_label
//         });

//         formattedData.data.tables.push({
//           id: tableId,
//           label: row.table_label,
//           section_id: row.table_section_id
//         });
//       }
//     }


//     const categoryId = row.menu_category_id;
//     let menuCategory = menuCategoryMap.get(categoryId);
//     if (!menuCategory) {
//       menuCategory = {
//         id: categoryId,
//         name: row.menu_category_name,
//         description: row.menu_category_description,
//         is_active: row.menu_category_is_active,
//         updated_on: row.menu_category_updated_on
//       };
//       menuCategoryMap.set(categoryId, menuCategory);
//       formattedData.data.menu_categories.push(menuCategory);
//     }


//     const menuItemId = row.menu_item_id;
//     if (!formattedData.data.menu_items.some(item => item.id === menuItemId)) {
//       formattedData.data.menu_items.push({
//         id: menuItemId,
//         name: row.menu_item_name,
//         description: row.menu_item_description,
//         type: row.menu_item_type,
//         cgst: row.menu_item_cgst,
//         sgst: row.menu_item_sgst,
//         price: row.menu_item_price,
//         image: row.menu_item_image,
//         is_active: row.menu_item_is_active,
//         updated_on: row.menu_item_updated_on,
//         category_id: categoryId
//       });
//     }


//     const paymentId = row.payment_id;
//     if (!formattedData.data.payments.some(payment => payment.id === paymentId)) {
//       formattedData.data.payments.push({
//         id: paymentId,
//         type: row.payment_type,
//         is_active: row.payment_is_active
//       });
//     }
//   }


//   formattedData.data.sections.forEach(section => {
//     if (section.tables.length === 0) {
//       section.tables = [];
//     }
//   });

//   return formattedData;
// }

function formatData(results) {
  const formattedData = {
    info: {
      restaurant_id: null,
      restaurant_name: null,
      gst_no: null,
      address: null,
      email: null,
      contact: null,
      hasInventory: null,
    },
    data: {
      sections: [],
      menu_categories: [],
      menu_items: [],
      tables: [],
      payments: []
    }
  };

  const sectionMap = new Map();
  const menuCategoryMap = new Map();

  for (const row of results) {
    if (!formattedData.info.restaurant_id) {
      formattedData.info.restaurant_id = row.restaurant_id;
      formattedData.info.restaurant_name = row.restaurant_name;
      formattedData.info.gst_no = row.gst_no;
      formattedData.info.address = row.address;
      formattedData.info.email = row.email;
      formattedData.info.contact = row.contact_no;
      formattedData.info.hasInventory = row.hasInventory;
    }

    const sectionId = row.section_id;
    let section = sectionMap.get(sectionId);
    if (!section) {
      section = {
        id: sectionId,
        name: row.section_name,
        description: row.section_description,
        max_table_capacity: row.max_table_capacity,
        no_of_tables: row.no_of_tables,
        tables: []
      };
      sectionMap.set(sectionId, section);
      formattedData.data.sections.push(section);
    }

    const tableId = row.table_id;
    if (tableId !== null) {
      if (!section.tables.some(table => table.id === tableId)) {
        section.tables.push({
          id: tableId,
          label: row.table_label
        });
      }
    }

    const categoryId = row.menu_category_id;
    let menuCategory = menuCategoryMap.get(categoryId);
    if (!menuCategory) {
      menuCategory = {
        id: categoryId,
        name: row.menu_category_name,
        description: row.menu_category_description,
        is_active: row.menu_category_is_active,
        updated_on: row.menu_category_updated_on
      };
      menuCategoryMap.set(categoryId, menuCategory);
      formattedData.data.menu_categories.push(menuCategory);
    }

    const menuItemId = row.menu_item_id;
    let menuItem = formattedData.data.menu_items.find(item => item.id === menuItemId);

    if (!menuItem) {
      menuItem = {
        id: menuItemId,
        name: row.menu_item_name,
        description: row.menu_item_description,
        type: row.menu_item_type,
        cgst: row.menu_item_cgst,
        sgst: row.menu_item_sgst,
        price: row.menu_item_price,
        code: row.menu_item_code,
        image: row.menu_item_image,
        is_active: row.menu_item_is_active,
        updated_on: row.menu_item_updated_on,
        category_id: categoryId,
        out_of_stock: false
      };
      formattedData.data.menu_items.push(menuItem);
    }

    if (row.calculated_position !== null && row.threshold !== null) {
      if (row.calculated_position < row.threshold) {
        menuItem.out_of_stock = true;
      }
    }

    const paymentId = row.payment_id;
    if (!formattedData.data.payments.some(payment => payment.id === paymentId)) {
      formattedData.data.payments.push({
        id: paymentId,
        type: row.payment_type,
        is_active: row.payment_is_active
      });
    }
  }

  return formattedData;
}


function formatDataTables(tables, sections, orders, orderDetails, waiters) {
  const formattedData = {
    tables: [],
    sections: [],
    waiters: [],
  };

  // Format waiters if it's defined
  if (waiters) {
    // console.log(waiters);
    formattedData.waiters = waiters.map(waiter => ({
      id: waiter.id,
      name: waiter.first_name,
      // name: waiter.first_name + ' ' + waiter.last_name??"",
      gender: "Male"
    }));
  }

  // Format sections
  formattedData.sections = sections.map(section => ({
    id: section.id,
    name: section.name,
    description: section.description,
    max_table_capacity: section.max_table_capacity,
    no_of_tables: section.no_of_tables
  }));

  // Format tables
  formattedData.tables = tables.map(table => ({
    id: table.id,
    label: table.label,
    section_id: table.section_id,
    status: table.status,
    orders: []
  }));

  // Iterate through each table
  formattedData.tables.forEach(table => {
    // Filter orders for this table
    const tableOrders = orders.filter(order => order.table_no === table.id && order.order_status === 'Running');

    // Format orders for this table
    table.orders = tableOrders.map(order => {
      const orderWithDetails = {
        id: order.oid,
        order_id: order.order_id,
        order_status: order.order_status,
        date: order.date,
        time: order.time,
        type: order.type,
        table_no: order.table_no,
        token_no: order.token_no,
        amount: order.amount,
        cgst: order.cgst,
        sgst: order.sgst,
        parcel_charges: order.parcel_charges,
        delivery_charges: order.delivery_charges,
        grand_total: order.grand_total,
        payment_mode: order.payment_mode,
        head_count: order.head_count,
        payment_status: order.payment_status,
        order_details: []
      };

      // Find order details for this order
      const detailsForOrder = orderDetails.filter(detail => parseInt(detail.order_id) === parseInt(order.oid));
      orderWithDetails.order_details = detailsForOrder.map(detail => ({
        order_details_id: detail.id,
        order_id: detail.order_id,
        kot_id: detail.kot_id,
        menu_item_id: detail.menu_item_id,
        menu_item_name: detail.menu_item_name,
        menu_item_cgst: detail.cgst,
        menu_item_sgst: detail.sgst,
        quantity: detail.quantity,
        price: detail.price,
        instruction: detail.instruction
      }));

      return orderWithDetails;
    });
  });

  return formattedData;
}




export { RestaurantDataController };
