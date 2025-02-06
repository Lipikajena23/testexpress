//FOR TESTING PURPOSES AND DOESNT EXIST IN API LIST
import db from '../config/db.js';

class DevicesController {
  static getAll(req, res) {
    db.query('SELECT * FROM devices', (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        console.error('Failed SQL query:', 'SELECT * FROM devices');
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }

  static getById(req, res) {
    const restoId = req.params.id;
    db.query('SELECT * FROM devices WHERE RestaurantID = ?', [restoId], (err, results) => {
      if (err) {
        console.error('Error querying MySQL:', err);
        console.error('Failed SQL query:', `SELECT * FROM devices WHERE id = ${restoId}`);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json(results);
      }
    });
  }
}

export {DevicesController};
//FOR TESTING PURPOSES AND DOESNT EXIST IN API LIST