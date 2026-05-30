const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// ---- inline auth middleware ----
function protect(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
        return res.status(401).json({ message: 'Not authorized' });
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        User.findById(decoded.id).select('-password').then(user => {
            if (!user) return res.status(401).json({ message: 'User not found' });
            req.user = user;
            next();
        }).catch(err => res.status(500).json({ message: err.message }));
    } catch (err) {
        res.status(401).json({ message: 'Token invalid', error: err.message });
    }
}

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields required' });
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already registered' });
        const user = await User.create({ name, email, password });
        res.status(201).json({
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body.email);
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        console.log('User found:', user ? 'yes' : 'no');

        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await user.comparePassword(password);
        console.log('Password match:', isMatch);

        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        res.json({
            token: generateToken(user._id),
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get profile
router.get('/profile', protect, async (req, res) => {
    res.json({ user: req.user });
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const user = await User.findById(req.user._id);
        if (name) user.name = name;
        if (phone) user.phone = phone;
        await user.save();
        res.json({ message: 'Profile updated', user: { name: user.name, email: user.email, phone: user.phone } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;