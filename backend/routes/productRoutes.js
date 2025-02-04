const express = require('express');
const { Product, Admin } = require('../models');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({ error: 'Please authenticate as an admin' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate as an admin' });
  }
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// Create a product (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    const product = await Product.create({ 
      name, 
      description, 
      price, 
      stock, 
      category 
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// Update a product (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;
    
    // Primero verificamos si el producto existe
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Actualizamos el producto existente
    await product.update({
      name,
      description,
      price,
      stock,
      category
    });

    // Devolvemos el producto actualizado
    return res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// Delete a product (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });

    if (deleted) {
      return res.status(204).json({ message: 'Product deleted successfully' });
    }

    throw new Error('Product not found');
  } catch (error) {
    res.status(400).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
