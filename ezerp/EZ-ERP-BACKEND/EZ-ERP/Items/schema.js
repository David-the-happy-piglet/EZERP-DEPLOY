import mongoose from 'mongoose';
import orderSchema from '../Orders/schema';

export const itemType = {
    PRODUCT: 'PRODUCT',
    MATERIAL: 'MATERIAL',
    SEMI_PRODUCT: 'SEMI_PRODUCT'
};


const itemSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    orderNumber:{
        type: String,
        ref: 'Order',
        required: function () { return (this.type === itemType.PRODUCT) || (this.type === itemType.SEMI_PRODUCT); }
    },
    name: {
        type: String,
        required: true
    },
    type: {    
        type: String,
        enum: Object.values(itemType),
        required: true
    },
    price: {
        type: Number,
    },
    quantity: {
        type: Number,
        required: true
    },
    size: {
        type: String,
        required: function () { return (this.type === itemType.SEMI_PRODUCT) || (this.type === itemType.PRODUCT ); }
    },
    standard: {
        type: String,
        required: function () { return this.type === itemType.PRODUCT; }
    },
    description: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});