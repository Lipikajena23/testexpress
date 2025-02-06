import { createPool } from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const db = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  } else {
    connection.release();
    console.log('Connected to MySQL database');
  }
});

export default db;





// import { createConnection } from 'mysql2';
// import dotenv from 'dotenv';

// dotenv.config();

// const db = createConnection({
//   host: process.env.DB_HOST ,
//   user: process.env.DB_USER ,
//   password: process.env.DB_PASSWORD ,
//   database: process.env.DB_DATABASE ,
//   port: process.env.DB_PORT,
//   // ssl:
// });

// db.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL:', err);
//     process.exit(1);
//   } else {
//     console.log('Connected to MySQL database');
//   }
// });

// export default db;

