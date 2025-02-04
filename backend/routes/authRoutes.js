const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Admin } = require('../models');

const router = express.Router();

// User Login route
router.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.validPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token, role: 'user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User Register route
router.post('/user/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Ensure only user registration is allowed
    if (req.body.role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is not allowed' });
    }

    // Create new user
    const user = await User.create({
      username,
      password
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, role: 'user' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Login route
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin
    const admin = await Admin.findOne({ where: { username } });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check password
    const isMatch = await admin.validPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token, role: 'admin' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
