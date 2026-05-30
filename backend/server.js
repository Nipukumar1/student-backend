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

// Frontend path
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');
        await createDefaultAdmin();
    })
    .catch(err => console.error('❌ MongoDB Error:', err));

async function createDefaultAdmin() {
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) return;

        const existing = await User.findOne({ email: adminEmail }).select('+password');
        if (!existing) {
            // Create with pre-hashed password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = new (require('./models/User'))({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });
            // Save without triggering pre-save hook double hash
            await mongoose.model('User').collection.insertOne({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                phone: '',
                createdAt: new Date()
            });
            console.log(`✅ Admin created: ${adminEmail}`);
        } else {
            if (existing.role !== 'admin') {
                await mongoose.model('User').updateOne({ email: adminEmail }, { role: 'admin' });
            }
            console.log(`✅ Admin exists: ${adminEmail}`);
        }
    } catch (err) {
        console.error('⚠️ Admin setup error:', err.message);
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Serve frontend
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'frontend', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) res.status(200).json({ message: 'InfinityStore API is running ✅' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));