import mongoose from 'mongoose';

const inventoryRecordSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    items:
        [{
            itemId: {
                type: String,
                ref: 'Item',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }],
    type: {
        type: String,
        enum: ['in', 'out'],
        required: true
    },
    byUser: {
        type: String,
        ref: 'User',
        required: true
    },
    signed: {
        type: Boolean,
        required: true,
        default: false
    },
    signedBy: {
        type: String,
        ref: 'User',
        required: function() {
            return this.signed;
        }
    },
    description: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'inventoryRecords' });

export default inventoryRecordSchema;