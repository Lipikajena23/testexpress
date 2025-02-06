// Creating an instance of the Express application
// Setting the server port
// register routes in index.js before server starts
//shutdown on ctrl+c
// Starting the server and listening on the specified port

import express from 'express';
import db from './config/db.js';
import routes from './routes/index.js';
import bodyParser from 'body-parser';


const app = express();
app.use(bodyParser.json());
const port = process.env.PORT||3000;

// const host = process.env.DB_HOST;
app.use(routes);

process.on('SIGINT', () => {
  console.log('Closing database connection and shutting down server');
  db.end();
  process.exit();
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
