import express from 'express';
import customerDAO from './dao.js';

const router = express.Router();

// Middleware to validate customer data
const validateCustomerData = (req, res, next) => {
    const { companyName, name, department, position, phone, address } = req.body;

    // Required fields validation based on schema
    if (!companyName || !name || !department || !position) {
        return res.status(400).json({ error: 'Company name, contact name, department, and position are required' });
    }

    // Phone format validation if provided
    if (phone) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }
    }

    // Address validation - it's just a string in the schema
    if (address && typeof address !== 'string') {
        return res.status(400).json({ error: 'Address must be a string' });
    }

    next();
};

// Create a new customer
router.post('/', validateCustomerData, async (req, res) => {
    try {
        const customer = await customerDAO.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        if (error.message.includes('duplicate key')) {
            res.status(409).json({ error: 'Customer with this ID already exists' });
        } else {
            res.status(400).json({ error: error.message });
        }
    }
});

// Get all customers
router.get('/', async (req, res) => {
    try {
        const customers = await customerDAO.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await customerDAO.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search customers by name or company
router.get('/search/:query', async (req, res) => {
    try {
        const customers = await customerDAO.searchCustomers(req.params.query);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update customer
router.put('/:id', validateCustomerData, async (req, res) => {
    try {
        const customer = await customerDAO.updateCustomer(req.params.id, req.body);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(customer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const customer = await customerDAO.deleteCustomer(req.params.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 