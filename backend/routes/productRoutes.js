const express = require('express');
const { Product, Admin } = require('../models');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const path = require('path');

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

// Servir imágenes estáticas
router.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, '../uploads', filename));
});

// Create a product (admin only)
router.post('/', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);
    
    const { name, description, price, stock, category } = req.body;
    
    // Validar que los campos requeridos estén presentes
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    // Convertir price a número
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) {
      return res.status(400).json({ message: 'Price must be a valid number' });
    }

    // Convertir stock a número
    const numericStock = stock ? parseInt(stock) : 0;
    if (isNaN(numericStock)) {
      return res.status(400).json({ message: 'Stock must be a valid number' });
    }
    
    // Crear el objeto de producto
    const productData = {
      name,
      description: description || '',
      price: numericPrice,
      stock: numericStock,
      category: category || ''
    };

    // Si hay una imagen subida, agregar la URL
    if (req.file) {
      productData.imageUrl = `/uploads/${req.file.filename}`;
    }

    console.log('Creating product with data:', productData);

    const product = await Product.create(productData);
    console.log('Product created successfully:', product);
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(400).json({ 
      message: 'Error creating product', 
      error: error.message,
      details: error.errors?.map(e => e.message) 
    });
  }
});

// Update a product (admin only)
router.put('/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;
    
    // Primero verificamos si el producto existe
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Preparar datos de actualización
    const updateData = {
      name,
      description,
      price,
      stock,
      category
    };

    // Si hay una nueva imagen, actualizar la URL
    if (req.file) {
      updateData.imageUrl = `/api/products/images/${req.file.filename}`;
    }

    // Actualizamos el producto existente
    await product.update(updateData);

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
    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;
