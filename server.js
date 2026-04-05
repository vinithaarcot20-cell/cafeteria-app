require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafeteria';
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    }).catch(err => {
        console.error("MongoDB connection error:", err);
    });

// Models
const User = require('./models/User');
const Order = require('./models/Order');

// API Routes

// Login (or Register)
app.post('/api/login', async (req, res) => {
    try {
        const { name, rollNumber } = req.body;
        if (!name || !rollNumber) {
            return res.status(400).json({ error: "Name and Roll Number are required" });
        }

        // Find user or create
        let user = await User.findOne({ rollNumber });
        if (!user) {
            user = new User({ name, rollNumber });
            await user.save();
        } else if (user.name !== name) {
            // Update name if roll number exists but name differs
            user.name = name;
            await user.save();
        }

        res.json({ message: "Login successful", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Place Order
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, items, totalAmount } = req.body;

        const order = new Order({
            user: userId,
            items,
            totalAmount,
            status: 'Preparing',
            // Simple offset - 15 mins for presentation/timer
            estimatedReadyTime: new Date(Date.now() + 15 * 60000)
        });

        await order.save();
        res.json({ message: "Order placed successfully", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get Order Status
app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        // Update status if time has passed
        if (order.status === 'Preparing' && new Date() >= order.estimatedReadyTime) {
            order.status = 'Ready';
            await order.save();
        }

        res.json({ order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Cancel Order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        res.json({ message: "Order cancelled successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
