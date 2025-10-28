import mongoose from 'mongoose';

// User roles enum


// Order status enum
export const OrderStatus = {
    BIDDING: 'BIDDING',
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED'
};

// Payment status enum
export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
};

const orderSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },

    customerId: {
        type: String,
        ref: 'Customer',
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    items: [{
        itemId: {
            type: String,
            ref: 'Item',
            required: true
        },
        price: {      
        //unit price
            type: Number,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalAmount: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    dueDate: {
        type: Date,
        required: true,
        get: (date) => date ? date.toISOString() : null,
        set: (date) => date ? new Date(date) : null
    },
    notes: String,
    isRework: {
        type: Boolean,
        default: false
    },
    reworkReason: {
        type: String,
        trim: true
    },
    reworkOrderNumber: {
        type: String,
        trim: true
    },
    orderImage: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        get: (date) => date ? date.toISOString() : null
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        get: (date) => date ? date.toISOString() : null
    }
},
    { collection: 'orders' });

// Update the updatedAt timestamp before saving
orderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default orderSchema;