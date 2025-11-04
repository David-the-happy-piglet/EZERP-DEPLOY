import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 本地存储目录
const UPLOAD_DIR = path.join(__dirname, '../../files');
const ORDERS_DIR = path.join(UPLOAD_DIR, 'orders');
const ITEMS_DIR = path.join(UPLOAD_DIR, 'items');

// 确保上传目录存在
const ensureDirectories = () => {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            console.log('Created upload directory:', UPLOAD_DIR);
        }
        if (!fs.existsSync(ORDERS_DIR)) {
            fs.mkdirSync(ORDERS_DIR, { recursive: true });
            console.log('Created orders directory:', ORDERS_DIR);
        }
        if (!fs.existsSync(ITEMS_DIR)) {
            fs.mkdirSync(ITEMS_DIR, { recursive: true });
            console.log('Created items directory:', ITEMS_DIR);
        }
        console.log('File storage directories initialized:', { UPLOAD_DIR, ORDERS_DIR, ITEMS_DIR });
    } catch (error) {
        console.error('Error creating directories:', error);
        throw error;
    }
};

// 初始化目录
ensureDirectories();

/**
 * 保存上传的文件到本地
 * @param {Object} file - multer 文件对象
 * @param {string} type - 'order' 或 'item'
 * @returns {Object} { filename: string, path: string, url: string }
 */
export async function saveFile(file, type = 'item') {
    if (!file) {
        throw new Error('saveFile: file is required');
    }

    if (!file.buffer) {
        throw new Error('saveFile: file.buffer is required. Make sure multer is configured with memoryStorage.');
    }

    // 确保目录存在
    ensureDirectories();

    const targetDir = type === 'order' ? ORDERS_DIR : ITEMS_DIR;
    const timestamp = Date.now();
    const originalName = file.originalname || 'file';
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}${ext}`;
    const filePath = path.join(targetDir, filename);

    try {
        // 保存文件
        fs.writeFileSync(filePath, file.buffer);
        console.log('File saved successfully:', { filename, filePath, size: file.buffer.length });
        
        // 验证文件是否真的写入
        if (!fs.existsSync(filePath)) {
            throw new Error(`File was not saved to ${filePath}`);
        }
    } catch (error) {
        console.error('Error saving file:', error);
        console.error('File info:', { 
            originalName, 
            filename, 
            filePath, 
            bufferSize: file.buffer?.length,
            targetDir,
            dirExists: fs.existsSync(targetDir)
        });
        throw new Error(`Failed to save file: ${error.message}`);
    }

    // 相对路径用于存储（相对于 files 目录）
    const relativePath = path.join(type === 'order' ? 'orders' : 'items', filename);

    return {
        filename,
        path: relativePath,
        fullPath: filePath
    };
}

/**
 * 根据相对路径获取文件的完整路径
 * @param {string} relativePath - 相对路径（如 'orders/xxx.pdf'）
 * @returns {string} 完整文件路径
 */
export function getFilePath(relativePath) {
    if (!relativePath) {
        return null;
    }
    return path.join(UPLOAD_DIR, relativePath);
}

/**
 * 检查文件是否存在
 * @param {string} relativePath - 相对路径
 * @returns {boolean}
 */
export function fileExists(relativePath) {
    if (!relativePath) {
        return false;
    }
    const fullPath = getFilePath(relativePath);
    return fs.existsSync(fullPath);
}

/**
 * 删除文件
 * @param {string} relativePath - 相对路径
 */
export function deleteFile(relativePath) {
    if (!relativePath) {
        return;
    }
    const fullPath = getFilePath(relativePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
}

/**
 * 获取文件的 MIME 类型
 * @param {string} relativePath - 相对路径
 * @returns {string}
 */
export function getFileMimeType(relativePath) {
    if (!relativePath) {
        return 'application/octet-stream';
    }
    return mime.lookup(relativePath) || 'application/octet-stream';
}

export default {
    saveFile,
    getFilePath,
    fileExists,
    deleteFile,
    getFileMimeType
};

