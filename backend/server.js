require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Ensure this is present for parsing JSON bodies
app.use(express.urlencoded({ extended: true })); // Add support for URL-encoded bodies

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// Database connection
sequelize.sync({ 
  force: false,  // Don't drop tables on each run
  alter: true    // Automatically alter tables to match model definitions
})
  .then(() => {
    console.log('Database connected and synchronized successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
