import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
},
    { collection: 'customers' });

export default customerSchema;