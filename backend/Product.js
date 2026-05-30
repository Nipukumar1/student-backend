const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    icon: {
        type: String,
        default: '🛍️'
    },
    rating: {
        type: Number,
        default: 4.0
    },
    inStock: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', ProductSchema);