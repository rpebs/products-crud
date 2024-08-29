const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const productRoutes = require('./routes/product');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/products', productRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
