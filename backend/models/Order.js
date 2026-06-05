const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: Number },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    image: { type: String }
});

const trackingEventSchema = new mongoose.Schema({
    stage: { type: String },
    date: { type: String },
    completed: { type: Boolean, default: true }
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String },
    customerAddress: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
    items: [orderItemSchema],
    subtotal: { type: Number },
    gst: { type: Number },
    total: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    status: {
        type: String,
        enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },
    trackingEvents: [trackingEventSchema],
    trackingId: { type: String },
    estimatedDelivery: { type: String },
    orderDate: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Auto-generate orderId before saving
orderSchema.pre('save', function(next) {
    if (!this.orderId) {
        this.orderId = 'INF' + Date.now().toString().slice(-8);
    }
    if (!this.orderDate) {
        this.orderDate = new Date().toLocaleString('en-IN');
    }
    if (!this.trackingId) {
        this.trackingId = 'TRK' + Math.floor(Math.random() * 100000);
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);