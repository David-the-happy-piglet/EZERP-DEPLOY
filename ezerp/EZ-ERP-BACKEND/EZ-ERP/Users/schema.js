import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const UserRole = {
    ADMIN: 'ADMIN',
    ASSISTANT: 'ASSISTANT',
    MKT: 'MKT',
    PMANAGER: 'PMANAGER',
    CUTTING: 'CUTTING',
    MACHINING: 'MACHINING',
    QC: 'QC',
    PLATING: 'PLATING',
    TEMPERING: 'TEMPERING',
    FINANCE: 'FINANCE',
    HR: 'HR',
    INVENTORY: 'INVENTORY',
    OTHER: 'OTHER',
    GUEST: 'GUEST'
};

export const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => uuidv4()
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },

    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.GUEST
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'users',
    _id: false // Disable automatic _id generation
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default userSchema;