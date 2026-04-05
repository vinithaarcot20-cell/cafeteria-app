const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    id: { type: String },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Preparing', 'Ready', 'Collected'], default: 'Preparing' },
    estimatedReadyTime: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
