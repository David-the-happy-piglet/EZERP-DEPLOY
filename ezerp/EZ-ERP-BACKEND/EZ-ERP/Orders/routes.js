import express from 'express';
import orderDAO from './dao.js';
import taskDAO from '../Tasks/dao.js';
import inventoryRecordDAO from '../InventoryRecord/dao.js';
import { OrderStatus, PaymentStatus } from './schema.js';
import { getImageUrl } from '../utils/s3.js';
import { verifySession } from '../middleware/auth.js';
const router = express.Router();

// Require an authenticated session for all order routes
router.use(verifySession);

// Middleware to validate order data
const validateOrderData = (req, res, next) => {
    const { orderNumber, customer, items, totalAmount, description } = req.body;

    // Required fields validation
    if (!orderNumber || !customer || !items || !totalAmount || !description) {
        return res.status(400).json({ error: 'Order number, customer, items, total amount, and description are required' });
    }

    // Validate customer data
    if (!customer._id || !customer.companyName || !customer.name || !customer.email) {
        return res.status(400).json({ error: 'Customer ID, company name, name, and email are required' });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Validate each item
    for (const item of items) {
        if (!item.productId || !item.productName || !item.quantity || !item.price) {
            return res.status(400).json({ error: 'Each item must have productId, productName, quantity, and price' });
        }
        if (item.quantity < 1) {
            return res.status(400).json({ error: 'Item quantity must be at least 1' });
        }
        if (item.price < 0) {
            return res.status(400).json({ error: 'Item price cannot be negative' });
        }
    }

    // Validate total amount
    if (totalAmount < 0) {
        return res.status(400).json({ error: 'Total amount cannot be negative' });
    }

    // Validate status if provided
    if (req.body.status && !Object.values(OrderStatus).includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid order status' });
    }

    // Validate payment status if provided
    if (req.body.paymentStatus && !Object.values(PaymentStatus).includes(req.body.paymentStatus)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }

    next();
};

// Create a new order
router.post('/', validateOrderData, async (req, res) => {
    try {
        const order = await orderDAO.createOrder(req.body);
        res.status(201).json(order);
    } catch (error) {
        if (error.message.includes('duplicate key')) {
            res.status(409).json({ error: 'Order with this ID or order number already exists' });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
});

// Get all orders
router.get('/', async (req, res) => {
    try {
        const orders = await orderDAO.getAllOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await orderDAO.getOrderById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get order by order number
router.get('/number/:orderNumber', async (req, res) => {
    try {
        const order = await orderDAO.getOrderByNumber(req.params.orderNumber);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get orders by status
router.get('/status/:status', async (req, res) => {
    try {
        const orders = await orderDAO.getOrdersByStatus(req.params.status);
        res.json(orders);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get orders by payment status
router.get('/payment/:paymentStatus', async (req, res) => {
    try {
        const orders = await orderDAO.getOrdersByPaymentStatus(req.params.paymentStatus);
        res.json(orders);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/image/:id', async (req, res) => {
    try {
        const order = await orderDAO.getOrderById(req.params.id);
        res.status(200).json(await getImageUrl(order.orderImage));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order image', error: error.message });
    }
});

router.get('/progress/:id', async (req, res) => {
    try {
        const tasks = await taskDAO.getTasksByOrderNumber(req.params.id);
        const totalItems = tasks.reduce((acc, task) => acc + task.items.reduce((acc, item) => acc + item.quantity, 0), 0);
        const finishedItems = tasks.reduce((acc, task) => acc + task.items.find(item => item.status === 'completed').reduce((acc, item) => acc + item.quantity, 0), 0);
        res.status(200).json({ totalItems, finishedItems, progress: finishedItems / totalItems * 100 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order progress', error: error.message });
    }
})

// Update order
router.put('/:id', validateOrderData, async (req, res) => {
    try {
        const order = await orderDAO.updateOrder(req.params.id, req.body);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !Object.values(OrderStatus).includes(status)) {
            return res.status(400).json({ error: 'Valid order status is required' });
        }
        const order = await orderDAO.updateOrderStatus(req.params.id, status);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        if (!paymentStatus || !Object.values(PaymentStatus).includes(paymentStatus)) {
            return res.status(400).json({ error: 'Valid payment status is required' });
        }
        const order = await orderDAO.updatePaymentStatus(req.params.id, paymentStatus);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add item to an order
router.post('/:id/items', async (req, res) => {
    try {
        const { itemId, itemName, itemType,itemSize, itemStandard, quantity = 1, price = 0 } = req.body;
        const order = await orderDAO.addItemToOrder(req.params.id, { itemId, itemName, itemType,itemSize, itemStandard, quantity, price });
        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/:id/upload-image', async (req, res) => {
    try {
        res.status(200).json(await orderDAO.updateOrderImage(req.params.id, req.body.imagePath));
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
});

router.put('/:id/items/:itemId', async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { price = 0, quantity = 1 } = req.body;
        const order = await orderDAO.updateItem(id, itemId, price, quantity);
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id/items/:itemId', async (req, res) => {
    try {
        const order = await orderDAO.deleteItem(req.params.id, req.params.itemId);
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const order = await orderDAO.deleteOrder(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
