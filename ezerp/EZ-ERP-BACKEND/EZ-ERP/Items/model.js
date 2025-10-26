import mongoose from 'mongoose';
import itemSchema from './schema.js';

const Item = mongoose.model('Item', itemSchema);

export default Item;