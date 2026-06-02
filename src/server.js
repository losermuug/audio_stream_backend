require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Streaming backend listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = app;
