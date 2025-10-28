import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        trim: true
    },
    orderRelated: {
        type: Boolean,
        required: true,
        default: false
    },

    orderNumber: {
        type: String,
        trim: true,
        required: function() {
            return this.orderRelated;
        }
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
        trim: true
    },
    assignedTo: {
        type: String,
        required: true,
        trim: true
    },
    assignedBy: {
        type: String,
        required: true,
        trim: true
    },
    postDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'in progress', 'completed'],
        default: 'pending'
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    progressDetails: {
        type: [{
            date: {
                type: Date,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }],
        required: false
    },

    items: [{
        itemId: {
            type: String,
            ref: 'Item',
            required: function() {
            return this.orderRelated;
        }
        },
    
        quantity: {
            type: Number,
            required: function() {
                return this.orderRelated;
            },
            min: 1
        }
    }],
    typeI:{
        type: String,
        enum: ['cutting', 'machining', 'plating', 'QC', 'tempering', 'shipping','other'],
        required: function() {
            return this.orderRelated;
        }
    },
    typeII:{
        type: String,
        enum: ['rework','add-on'],
        required: false
    },
    outsourcing:{
        type: Boolean,
        required: false
    },
    outsourcingCompany:{
        type: String,
        required: false
    },
    outsourcingContact:{
        type: String,
        required: false
    }
}, {
    timestamps: true,
    collection: 'tasks'
});

export default taskSchema;
