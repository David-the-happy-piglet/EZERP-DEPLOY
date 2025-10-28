import InventoryRecord from './model.js';
import { v4 as uuidv4 } from 'uuid';

class InventoryRecordDAO {
    // Create a new inventory record
    async createInventoryRecord(recordData) {
        try {
            const record = new InventoryRecord({
                ...recordData,
                _id: recordData._id || `INV-${uuidv4().substring(0, 8)}`,
                createdAt: recordData.createdAt || new Date()
            });
            return await record.save();
        } catch (error) {
            throw new Error(`Error creating inventory record: ${error.message}`);
        }
    }

    // Get all inventory records
    async getAllInventoryRecords() {
        try {
            return await InventoryRecord.find({}).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records: ${error.message}`);
        }
    }

    // Get inventory record by ID
    async getInventoryRecordById(id) {
        try {
            return await InventoryRecord.findById(id);
        } catch (error) {
            throw new Error(`Error finding inventory record: ${error.message}`);
        }
    }

    // Get inventory records by item ID
    async getInventoryRecordsByItemId(itemId) {
        try {
            return await InventoryRecord.find({ 'items.itemId': itemId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records by item ID: ${error.message}`);
        }
    }

    // Get inventory records by type (in/out)
    async getInventoryRecordsByType(type) {
        try {
            const validTypes = ['in', 'out'];
            if (!validTypes.includes(type)) {
                throw new Error('Invalid inventory record type');
            }
            return await InventoryRecord.find({ type }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records by type: ${error.message}`);
        }
    }

    // Get inventory records by user
    async getInventoryRecordsByUser(byUser) {
        try {
            return await InventoryRecord.find({ byUser }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records by user: ${error.message}`);
        }
    }

    async getInventoryRecordsBySignedBy(signedBy) {
        try {
            return await InventoryRecord.find({ signedBy }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records by signed by: ${error.message}`);
        }
    }

    // Get inventory records by date range
    async getInventoryRecordsByDateRange(startDate, endDate) {
        try {
            return await InventoryRecord.find({
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }).sort({ createdAt: -1 });
        } catch (error) {
            throw new Error(`Error fetching inventory records by date range: ${error.message}`);
        }
    }

    // Get current inventory quantity for an item
    async getCurrentInventoryQuantity(itemId) {
        try {
            const records = await InventoryRecord.find({ "items.itemId": itemId }).sort({ createdAt: 1 });
            let quantity = 0;

            records.forEach(record => {
                if (record.type === 'in') {
                    quantity += record.items.find(item => item.itemId === itemId).quantity;
                } else if (record.type === 'out') {
                    quantity -= record.items.find(item => item.itemId === itemId).quantity;
                }
            });

            return quantity;
        } catch (error) {
            throw new Error(`Error calculating current inventory quantity: ${error.message}`);
        }
    }

    // Get inventory movement summary for an item
    async getInventoryMovementSummary(itemId) {
        try {
            const records = await InventoryRecord.find({ "items.itemId": itemId }).sort({ createdAt: 1 });
            let totalIn = 0;
            let totalOut = 0;
            let currentQuantity = 0;

            records.forEach(record => {
                if (record.type === 'in') {
                    diff = record.items.find(item => item.itemId === itemId).quantity;
                    totalIn += diff;
                    currentQuantity += diff;
                } else if (record.type === 'out') {
                    diff = record.items.find(item => item.itemId === itemId).quantity;
                    totalOut += diff;
                    currentQuantity -= diff;
                }
            });

            return {
                itemId,
                totalIn,
                totalOut,
                currentQuantity,
                recordCount: records.length
            };
        } catch (error) {
            throw new Error(`Error calculating inventory movement summary: ${error.message}`);
        }
    }

    // Update inventory record
    async updateInventoryRecord(id, updateData) {
        try {
            const record = await InventoryRecord.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );
            return record;
        } catch (error) {
            throw new Error(`Error updating inventory record: ${error.message}`);
        }
    }

    // Delete inventory record
    async deleteInventoryRecord(id) {
        try {
            const record = await InventoryRecord.findByIdAndDelete(id);
            return record;
        } catch (error) {
            throw new Error(`Error deleting inventory record: ${error.message}`);
        }
    }

    // Sign inventory record
    async signInventoryRecord(id, signedBy) {
        try {
            const record = await InventoryRecord.findByIdAndUpdate(id, { signed: true, signedBy }, { new: true });
            return record;
        } catch (error) {
            throw new Error(`Error signing inventory record: ${error.message}`);
        }
    }

    // Bulk create inventory records
    async bulkCreateInventoryRecords(recordsData) {
        try {
            const records = recordsData.map(data => ({
                ...data,
                _id: data._id || `INV-${uuidv4().substring(0, 8)}`,
                createdAt: data.createdAt || new Date()
            }));
            return await InventoryRecord.insertMany(records);
        } catch (error) {
            throw new Error(`Error bulk creating inventory records: ${error.message}`);
        }
    }


    // Get inventory records with pagination
    async getInventoryRecordsPaginated(page = 1, limit = 10, filters = {}) {
        try {
            const skip = (page - 1) * limit;
            const query = InventoryRecord.find(filters)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const records = await query.exec();
            const total = await InventoryRecord.countDocuments(filters);

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
            throw new Error(`Error fetching paginated inventory records: ${error.message}`);
        }
    }
}

export default new InventoryRecordDAO();
