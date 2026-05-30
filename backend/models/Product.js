const express = require('express');
const Product = require('./Product');

const router = express.Router();

// Generate and save unlimited products
router.post('/generate', async (req, res) => {
    try {
        const categories = ["Electronics", "Fashion", "Home", "Beauty", "Sports", "Toys", "Gaming", "Books", "Automotive", "Groceries"];
        const icons = { Electronics:"📱", Fashion:"👕", Home:"🛋️", Beauty:"💄", Sports:"⚽", Toys:"🧸", Gaming:"🎮", Books:"📚", Automotive:"🚗", Groceries:"🍎" };
        const names = ["Pro", "Ultra", "Max", "Elite", "Premium", "Neo", "X", "Infinity", "Smart", "Deluxe"];
        const items = ["Phone", "Laptop", "Watch", "Speaker", "Shoes", "Jacket", "Bag", "Camera", "Drone", "Headphones"];
        
        let products = [];
        for (let i = 1; i <= 500; i++) {
            const cat = categories[i % categories.length];
            const name = `${names[i % names.length]} ${items[i % items.length]} ${Math.floor(i/12)+1}`;
            const price = 399 + (i % 297) * 12;
            
            products.push({
                productId: i,
                name: name,
                category: cat,
                price: Math.floor(price/10)*10,
                icon: icons[cat] || "🛍️"
            });
        }
        
        // Clear existing and insert new
        await Product.deleteMany({});
        await Product.insertMany(products);
        
        res.json({ message: `${products.length} products generated successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Error generating products', error: error.message });
    }
});

// Get all products with pagination
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, category = 'all', search = '' } = req.query;
        
        let query = {};
        if (category !== 'all') query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
        
        const products = await Product.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ productId: 1 });
        
        const total = await Product.countDocuments(query);
        
        res.json({
            products,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});

module.exports = router;