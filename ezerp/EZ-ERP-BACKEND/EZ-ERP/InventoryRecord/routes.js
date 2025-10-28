import express from 'express';
import inventoryRecordDAO from './dao.js';
import itemDAO from '../Items/dao.js';

const router = express.Router();

// Create a new inventory record
router.post('/', async (req, res) => {
    try {
        const { itemId, quantity, type, byUser, description } = req.body;
        
        // Validate required fields
        if (!itemId || !quantity || !type || !byUser) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: itemId, quantity, type, byUser'
            });
        }

        // Validate type
        if (!['in', 'out'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be "in" or "out"'
            });
        }

        // Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const record = await inventoryRecordDAO.createInventoryRecord({
            itemId,
            quantity,
            type,
            byUser,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Inventory record created successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get all inventory records
router.get('/', async (req, res) => {
    try {
        const records = await inventoryRecordDAO.getAllInventoryRecords();
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory records with pagination
router.get('/paginated', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = {};

        // Add filters if provided
        if (req.query.itemId) filters.itemId = req.query.itemId;
        if (req.query.type) filters.type = req.query.type;
        if (req.query.byUser) filters.byUser = req.query.byUser;

        const result = await inventoryRecordDAO.getInventoryRecordsPaginated(page, limit, filters);
        
        res.json({
            success: true,
            data: result.records,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory record by ID
router.get('/:id', async (req, res) => {
    try {
        const record = await inventoryRecordDAO.getInventoryRecordById(req.params.id);
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Inventory record not found'
            });
        }

        res.json({
            success: true,
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory records by item ID
router.get('/item/:itemId', async (req, res) => {
    try {
        const records = await inventoryRecordDAO.getInventoryRecordsByItemId(req.params.itemId);
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get current inventory quantity for an item
router.get('/item/:itemId/quantity', async (req, res) => {
    try {
        const quantity = await inventoryRecordDAO.getCurrentInventoryQuantity(req.params.itemId);
        res.json({
            success: true,
            data: { itemId: req.params.itemId, currentQuantity: quantity }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory movement summary for an item
router.get('/item/:itemId/summary', async (req, res) => {
    try {
        const summary = await inventoryRecordDAO.getInventoryMovementSummary(req.params.itemId);
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory records by type
router.get('/type/:type', async (req, res) => {
    try {
        const records = await inventoryRecordDAO.getInventoryRecordsByType(req.params.type);
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory records by user
router.get('/user/:userId', async (req, res) => {
    try {
        const records = await inventoryRecordDAO.getInventoryRecordsByUser(req.params.userId);
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get inventory records by date range
router.get('/date-range/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const records = await inventoryRecordDAO.getInventoryRecordsByDateRange(startDate, endDate);
        res.json({
            success: true,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Update inventory record
router.put('/:id', async (req, res) => {
    try {
        const { quantity, type, description } = req.body;
        
        // Validate type if provided
        if (type && !['in', 'out'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid type. Must be "in" or "out"'
            });
        }

        // Validate quantity if provided
        if (quantity && quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const record = await inventoryRecordDAO.updateInventoryRecord(req.params.id, req.body);
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Inventory record not found'
            });
        }

        res.json({
            success: true,
            message: 'Inventory record updated successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete inventory record
router.delete('/:id', async (req, res) => {
    try {
        const record = await inventoryRecordDAO.deleteInventoryRecord(req.params.id);
        
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Inventory record not found'
            });
        }

        res.json({
            success: true,
            message: 'Inventory record deleted successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Bulk create inventory records
router.post('/bulk', async (req, res) => {
    try {
        const { records } = req.body;
        
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Records array is required and must not be empty'
            });
        }

        // Validate each record
        for (const record of records) {
            if (!record.itemId || !record.quantity || !record.type || !record.byUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Each record must have itemId, quantity, type, and byUser fields'
                });
            }
            
            if (!['in', 'out'].includes(record.type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid type in one or more records. Must be "in" or "out"'
                });
            }
            
            if (record.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Quantity must be greater than 0 in all records'
                });
            }
        }

        const createdRecords = await inventoryRecordDAO.bulkCreateInventoryRecords(records);
        
        res.status(201).json({
            success: true,
            message: `${createdRecords.length} inventory records created successfully`,
            data: createdRecords
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.patch('/:id/sign', async (req, res) => {
    try {
        const { signedBy } = req.body;
        if (!signedBy) {
            return res.status(400).json({
                success: false,
                message: 'Signed by is required'
            });
        }
        const record = await inventoryRecordDAO.signInventoryRecord(req.params.id, signedBy);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Inventory record not found'
            });
        }
        for (const item of record.items) {
            try {
                await itemDAO.updateItemQuantity(item.itemId, item.quantity * -1);
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error updating item quantity'
                });
            }
        }
        res.json({
            success: true,
            message: 'Inventory record signed successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
