import mongoose from 'mongoose';
import inventoryRecordSchema from './schema.js';

const InventoryRecord = mongoose.model('InventoryRecord', inventoryRecordSchema);

export default InventoryRecord;
