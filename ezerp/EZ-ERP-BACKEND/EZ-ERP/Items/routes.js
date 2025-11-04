import express from 'express';
import multer from 'multer';
import itemDAO from './dao.js';
import { saveFile, getFilePath, fileExists } from '../utils/fileStorage.js';

const router = express.Router();

// Configure multer for file uploads (in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to validate item data
const validateItemData = (req, res, next) => {
    const { name, type, orderId, price, quantity, size, standard, description } = req.body;
    if (orderId) {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: 'Invalid order id' });
        }
    }
    if (!name || !type || !price || !quantity || !size || !standard || !description) {
        return res.status(400).json({ error: 'Name, type, price, quantity, size, standard, and description are required' });
    }
    next();
};

router.get('/', async (req, res) => {
    try {
        const items = await itemDAO.getAllItems();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const item = await itemDAO.getItemById(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching item', error: error.message });
    }
});

router.get('/image/:id', async (req, res) => {
    try {
        const item = await itemDAO.getItemById(req.params.id);
        if (!item || !item.imagePath) {
            return res.status(404).json({ message: 'Item image not found' });
        }
        if (!fileExists(item.imagePath)) {
            return res.status(404).json({ message: 'Image file not found' });
        }
        // Return the URL path for the client to access
        res.status(200).json({ url: `/files/${item.imagePath}` });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching item image', error: error.message });
    }
});
router.get('/order/:orderNumber', async (req, res) => {
    try {
        const items = await itemDAO.getItemsByOrderNumber(req.params.orderNumber);
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const item = await itemDAO.createItem(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error creating item', error: error.message });
    }
});

router.post('/:id/upload-image', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const savedFile = await saveFile(req.file, 'item');
        const item = await itemDAO.updateItemImage(req.params.id, savedFile.path);
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
});

router.patch('/:id/quantity', async (req, res) => {
    try {
        const { quantity } = req.body;
        const item = await itemDAO.updateItemQuantity(req.params.id, quantity);
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error updating item quantity', error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const item = await itemDAO.deleteItem(req.params.id);
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
});
export default router;