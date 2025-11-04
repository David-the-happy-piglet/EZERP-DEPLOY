import Item from './model.js';
import { getUploadUrlPut } from '../utils/s3.js';
import { v4 as uuidv4 } from 'uuid';

class ItemDAO {
    async createItem(itemData) {
        try {
            const item = new Item({ _id: itemData._id || uuidv4(), ...itemData });
            return await item.save();
        } catch (error) {
            throw new Error(`Error creating item: ${error.message}`);
        }
    }
    
    async getAllItems() {
        try {
            return await Item.find({}).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching items: ${error.message}`);
        }
    }
    async getItemById(id) {
        try {
            return await Item.findById(id);
        } catch (error) {
            throw new Error(`Error fetching item: ${error.message}`);
        }
    }
    async getItemsByOrderNumber(orderNumber) {
        try {
            return await Item.find({ orderNumber }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching items by order id: ${error.message}`);
        }
    }
    async updateItem(id, itemData) {
        try {
            return await Item.findByIdAndUpdate(id, itemData, { new: true });
        } catch (error) {
            throw new Error(`Error updating item: ${error.message}`);
        }
    }

    async updateItemImage(id, imagePath) {
        try {
            return await Item.findByIdAndUpdate(id, { imagePath: imagePath }, { new: true });
        } catch (error) {
            throw new Error(`Error updating item image: ${error.message}`);
        }
    }
    async updateItemQuantity(id, quantity) {
        try {
            return await Item.findByIdAndUpdate(id, { quantity }, { new: true });
        } catch (error) {
            throw new Error(`Error updating item quantity: ${error.message}`);
        }
    }
    async deleteItem(id) {
        try {
            return await Item.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting item: ${error.message}`);
        }
    }

    // Get items with pagination
    async getItemsPaginated(page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;
            const query = Item.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const records = await query.exec();
            const total = await Item.countDocuments(filters);

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
            throw new Error(`Error fetching paginated items: ${error.message}`);
        }
    }
}

export default new ItemDAO();
