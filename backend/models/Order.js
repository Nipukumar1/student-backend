const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    customer: {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            default: 'India'
        }
    },

    items: [
        {
            productId: Number,
            name: String,
            price: Number,
            icon: String,
            quantity: Number
        }
    ],

    subtotal: {
        type: Number,
        required: true
    },

    gst: {
        type: Number,
        required: true
    },

    grandTotal: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        default: 'Cash on Delivery'
    },

    status: {
        type: String,
        default: 'Confirmed'
    },

    orderDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);