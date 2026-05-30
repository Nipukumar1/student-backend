const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        await createDefaultAdmin();
    })
    .catch(err => console.error('❌ MongoDB Error:', err));

// Auto-create admin from .env
async function createDefaultAdmin() {
    try {
        const User = require('./models/User');
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not in .env — skipping');
            return;
        }

        const existing = await User.findOne({ email: adminEmail });
        if (!existing) {
            await User.create({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'admin' });
            console.log(`✅ Admin created: ${adminEmail}`);
        } else if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log(`✅ Admin role updated: ${adminEmail}`);
        } else {
            console.log(`✅ Admin already exists: ${adminEmail}`);
        }
    } catch (err) {
        console.error('⚠️  Admin setup error:', err.message);
    }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// Make admin route
app.post('/api/make-admin', async (req, res) => {
    try {
        const { email, secret } = req.body;
        if (secret !== process.env.ADMIN_SECRET)
            return res.status(403).json({ message: 'Wrong secret' });
        const User = require('./models/User');
        const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: `${user.name} is now admin` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));