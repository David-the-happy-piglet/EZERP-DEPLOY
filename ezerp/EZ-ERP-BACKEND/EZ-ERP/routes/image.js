import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUploadUrlPut, getImageUrl } from '../utils/s3.js';

const router = express.Router();

// POST /api/images/presign
// Body: { fileName: string, contentType: string, itemId?: string }
router.post('/presign', async (req, res) => {
    try {
        const { fileName, contentType, itemId } = req.body || {};
        if (!fileName || !contentType) {
            return res.status(400).json({ error: 'fileName and contentType are required' });
        }

        const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
        const id = itemId || uuidv4();
        const key = `items/${id}-${Date.now()}-${safeName}`;
        const presign = await getUploadUrlPut({ key, contentType, expiresIn: 600 });
        res.json(presign); // { url, key, headers, expiresIn, method: 'PUT' }
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to presign' });
    }
});

// GET /api/images/url?key=items/...
router.get('/url', async (req, res) => {
    try {
        const { key } = req.query || {};
        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }
        const url = await getImageUrl(String(key));
        res.json({ url, key });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to get image url' });
    }
});

export default router;

