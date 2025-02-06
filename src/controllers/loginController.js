import db from '../config/db.js';

class LoginController {
  static read(req, res) {
    const emailid = req.body.email;
    const password = req.body.password;

    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [emailid, password], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        console.error('Failed SQL query:', `SELECT * FROM users WHERE email = ? AND password = ?`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length > 0) {
        db.query('SELECT id, first_name FROM users WHERE email = ?', [emailid], (err, userIdResults) => {
          if (err) {
            console.error('Error querying user ID:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
          }

          if (userIdResults.length === 0) {
            return res.status(500).json({ error: 'User not found' });
          }

          const userId = userIdResults[0].id;
          const userName = userIdResults[0].first_name;

          db.query('SELECT role, business_entity_id FROM user_business_entity_role_mapping WHERE user_id = ?', [userId], (err, roleResults) => {
            if (err) {
              console.error('Error querying role ID:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (roleResults.length === 0) {
              return res.status(500).json({ error: 'User role not found' });
            }

            const roleId = roleResults[0].role;
            const restoId = roleResults[0].business_entity_id;

            db.query(
              'SELECT product_id FROM business_entity_product_mapping WHERE business_entity_id = ? AND product_id IN (?, ?) LIMIT 1',
              [restoId, 1, 2],
              (err, productResults) => {
                if (err) {
                  console.error('Error querying product IDs:', err);
                  return res.status(500).json({ error: 'Internal Server Error' });
                }

                const productId = productResults.length > 0 ? productResults[0].product_id : 0;

                db.query(
                  'SELECT product_id FROM business_entity_product_mapping WHERE business_entity_id = ? AND product_id = ? LIMIT 1',
                  [restoId, 3],
                  (err, advancedInventoryResults) => {
                    if (err) {
                      console.error('Error querying advanced inventory:', err);
                      return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    const advancedInventory = advancedInventoryResults.length > 0 ? 1 : 0;

                    if (roleId === "1" || roleId === "2" || roleId === "3" || roleId === "4" || roleId === "5") {
                      res.json({
                        login: true,
                        user_id: userId,
                        product: productId,
                        role: roleId,
                        restaurant_id: restoId,
                        name: userName,
                        advancedInventory: roleId === "5" ? 0 : advancedInventory//so that we dont have two app bars frontend in store keeper login
                      });
                    } else {
                      res.json({ login: false, message: "User doesn't have access" });
                    }
                  }
                );
              }
            );

          });
        });
      } else {
        res.json({ login: false, message: "Invalid email or password" });
      }
    });
  }

}

export { LoginController };
