class ItemDAO {
    async createItem(itemData) {
        try {
            const item = new Item(itemData);
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
    async deleteItem(id) {
        try {
            return await Item.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(`Error deleting item: ${error.message}`);
        }
    }
}

export default new ItemDAO();
