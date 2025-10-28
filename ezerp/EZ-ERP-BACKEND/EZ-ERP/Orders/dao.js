import Order from './model.js';
import { OrderStatus, PaymentStatus } from './schema.js';
import { uploadImage } from '../utils/s3.js';
import { v4 as uuidv4 } from 'uuid';

class OrderDAO {
    // Create a new order
    async createOrder(orderData) {
        try {
            // Validate required fields
            if (!orderData.description || !orderData.customerId || !orderData.items || !orderData.customerId || !orderData.dueDate) {
                throw new Error('Order description, customer ID, items, due date are required');
            }

            // Validate items array
            if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
                throw new Error('Order must contain at least one item');
            }
            for (const item of orderData.items) {
                if (!item._id) {
                    try {
                        const newItem = await itemDAO.createItem(item);
                        item = {
                            itemId: newItem._id,
                            price: item.price ?? 0,
                            quantity: item.quantity ?? 1
                        };
                    } catch (error) {
                        throw new Error(`Error creating item: ${error.message}`);
                    }
                }
            }
            if (orderData.orderImagePath) {
                orderData.orderImage = (await uploadImage(orderData.orderImagePath)).key;
            }
            // Validate each item
            const order = new Order({
                ...orderData,
                _id: orderData._id || `ORD-${uuidv4().substring(0, 8)}`,
                status: orderData.status || OrderStatus.PENDING,
                paymentStatus: orderData.paymentStatus || PaymentStatus.PENDING,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return await order.save();
        } catch (error) {
            throw new Error(`Error creating order: ${error.message}`);
        }
    }

    // Add a new item to an existing order and recalculate totalAmount
    async addItemToOrder(orderId, itemData) {
        try {
            if (!itemData || !itemData.itemId || !itemData.type || !itemData.size || !itemData.standard) {
                throw new Error('Item itemId, type, size, and standard are required');
            }
            if (itemData.price < 0) {
                throw new Error('Item price cannot be negative');
            }

            if (itemData.quantity < 1) {
                throw new Error('Item quantity must be at least 1');
            }

            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            order.items.push({
                productId: itemData.productId,
                productName: itemData.productName,
                quantity: itemData.quantity,
                price: itemData.price
            });

            // Recalculate totalAmount
            order.totalAmount = order.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
            order.updatedAt = new Date();

            await order.save();
            return order;
        } catch (error) {
            throw new Error(`Error adding item to order: ${error.message}`);
        }
    }

    // Get all orders
    async getAllOrders() {
        try {
            return await Order.find({}).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching orders: ${error.message}`);
        }
    }

    // Get order by ID
    async getOrderById(id) {
        try {
            return await Order.findById(id);
        } catch (error) {
            throw new Error(`Error finding order: ${error.message}`);
        }
    }

    // Get order by order number
    async getOrderByNumber(orderNumber) {
        try {
            return await Order.findOne({ orderNumber });
        } catch (error) {
            throw new Error(`Error finding order by number: ${error.message}`);
        }
    }

    // Get orders by status
    async getOrdersByStatus(status) {
        try {
            if (!Object.values(OrderStatus).includes(status)) {
                throw new Error('Invalid order status');
            }
            return await Order.find({ status }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching orders by status: ${error.message}`);
        }
    }

    // Get orders by payment status
    async getOrdersByPaymentStatus(paymentStatus) {
        try {
            if (!Object.values(PaymentStatus).includes(paymentStatus)) {
                throw new Error('Invalid payment status');
            }
            return await Order.find({ paymentStatus }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching orders by payment status: ${error.message}`);
        }
    }

    // Update order
    async updateOrder(id, updateData) {
        try {
            const order = await Order.findByIdAndUpdate(
                id,
                {
                    ...updateData,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );
            return order;
        } catch (error) {
            throw new Error(`Error updating order: ${error.message}`);
        }
    }

    async updateOrderImage(id, imagePath) {
        try {
            image = await uploadImage(imagePath);
            const order = await Order.findByIdAndUpdate(
                id,
                { orderImage: image.key },
                { new: true }
            );
            return order;
        }
        catch (error) {
            throw new Error(`Error updating order image: ${error.message}`);
        }
    }

    // Update order status
    async updateOrderStatus(id, status) {
        try {
            if (!Object.values(OrderStatus).includes(status)) {
                throw new Error('Invalid order status');
            }
            const order = await Order.findByIdAndUpdate(
                id,
                {
                    status,
                    updatedAt: new Date()
                },
                { new: true }
            );
            return order;
        } catch (error) {
            throw new Error(`Error updating order status: ${error.message}`);
        }
    }

    async updateItem(orderId, itemId, price, quantity) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        const target = order.items.find(it => it.itemId === itemId);
        if (!target) throw new Error('Item not found');

        if (price != null) {
            if (price < 0) throw new Error('Item price cannot be negative');
            target.price = price;
        }
        if (quantity != null) {
            if (quantity < 1) throw new Error('Item quantity must be at least 1');
            target.quantity = quantity;
        }

        order.totalAmount = order.items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
        order.updatedAt = new Date();
        await order.save();
        return order;
    }
    // Update payment status
    async updatePaymentStatus(id, paymentStatus) {
        try {
            if (!Object.values(PaymentStatus).includes(paymentStatus)) {
                throw new Error('Invalid payment status');
            }
            const order = await Order.findByIdAndUpdate(
                id,
                {
                    paymentStatus,
                    updatedAt: new Date()
                },
                { new: true }
            );
            return order;
        } catch (error) {
            throw new Error(`Error updating payment status: ${error.message}`);
        }
    }

    // Delete order
    async deleteOrder(id) {
        try {
            const order = await Order.findByIdAndDelete(id);
            return order;
        } catch (error) {
            throw new Error(`Error deleting order: ${error.message}`);
        }
    }

    // Get orders with pagination
    async getOrdersPaginated(page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;
            const query = Order.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const records = await query.exec();
            const total = await Order.countDocuments(filters);

            return {
                records,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRecords: total,
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Error fetching paginated orders: ${error.message}`);
        }
    }
}

export default new OrderDAO();
