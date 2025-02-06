import db from '../config/db.js';
import util from 'util';

class RegistrationController {
  static async addBusinessEntity(req, res) {
    const query = util.promisify(db.query).bind(db);

    try {
      // Check if email exists in users table
      const emailExists = await query('SELECT COUNT(*) AS count FROM users WHERE email = ?', [req.body.email]);
      const phoneExists = await query('SELECT COUNT(*) AS count FROM users WHERE phone = ?', [req.body.contactNo]);
      
      if (emailExists[0].count > 0||phoneExists[0].count > 0) {
        return res.status(400).json({ error: 'Email/Phone is already used' });
      }

      // Get the maximum business_entity_id
      const maxBusinessEntityId = await query('SELECT MAX(business_entity_id) AS maxId FROM business_entity');

      const businessEntityId = maxBusinessEntityId[0].maxId + 1;

      const { businessName, Name, email, contactNo } = req.body;
      const Address = "";
      const Group_ID = businessEntityId;
      const Business_type = "G";

      // Insert into BusinessEntity table
      await query(
        'INSERT INTO business_entity VALUES(?,?,?,?,?,?,?,?)',
        [
          businessEntityId,
          businessName,
          Name,
          email,
          contactNo,
          Address,
          Group_ID,
          Business_type
        ]
      );

      // Generate random password
      const password = generateRandomText();

      // Insert into users table
      const userInsertResult = await query(
        'INSERT INTO users (first_name, email, phone, password,is_active) VALUES(?,?,?,?,?)',
        [
          Name,
          email,
          contactNo,
          password,
          0
        ]
      );

      const userId = userInsertResult.insertId;
      const role = 1;

      // Insert into user_business_entity_role_mapping
      await query(
        'INSERT INTO user_business_entity_role_mapping (user_id, business_entity_id, role) VALUES(?,?,?)',
        [
          userId,
          businessEntityId,
          role
        ]
      );

      // Return success response
      return res.status(200).json({ message: 'Business entity and user registered successfully' });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

function generateRandomText() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let randomText = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomText += characters.charAt(randomIndex);
  }
  return randomText;
}

export { RegistrationController };
