import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Card, Row, Col, Alert, Table } from 'react-bootstrap';
import { orderService, customerService } from '../services/api';
import type { Order, Customer } from '../types';

export default function OrderCreate() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Order>>({
        orderNumber: '',
        description: '',
        items: [],
        totalAmount: 0,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        dueDate: new Date().toISOString()
    });
    const [newItem, setNewItem] = useState({
        productId: '',
        productName: '',
        quantity: 1,
        price: 0
    });

    useEffect(() => {
        fetchCustomers();
        generateOrderNumber();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = customers.filter(customer =>
                customer.companyName.toLowerCase().includes(term)
            );
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const generateOrderNumber = async () => {
        try {
            const response = await orderService.getAll();
            const orders = response.data as Order[];
            const currentYear = new Date().getFullYear();

            // Filter orders from current year and extract sequence numbers
            const currentYearOrders = orders
                .filter(order => order.orderNumber.startsWith(`ORD-${currentYear}-`))
                .map(order => {
                    const parts = order.orderNumber.split('-');
                    return parseInt(parts[2]);
                })
                .sort((a, b) => b - a);

            // Get the highest sequence number or start from 1
            const lastSequence = currentYearOrders[0] || 0;
            const newSequence = lastSequence + 1;

            // Format: ORD-YEAR-XXX (3-digit sequence)
            const newNumber = `ORD-${currentYear}-${String(newSequence).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, orderNumber: newNumber }));
        } catch (err: any) {
            setError('Failed to generate order number');
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            setCustomers(response.data as Customer[]);
            setFilteredCustomers(response.data as Customer[]);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch customers');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.orderNumber || !formData.customer || !formData.items || formData.items.length === 0 || !formData.dueDate || !formData.shippingAddress) {
            setError('Please fill in all required fields and add at least one item');
            return;
        }
        try {
            const orderData = {
                ...formData,
                orderNumber: formData.orderNumber,
                customer: formData.customer,
                items: formData.items,
                totalAmount: formData.totalAmount || 0,
                status: (formData.status as 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') || 'PENDING',
                paymentStatus: (formData.paymentStatus as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED') || 'PENDING',
                dueDate: new Date(formData.dueDate).toISOString(),
                shippingAddress: formData.shippingAddress
            };
            await orderService.create(orderData);
            navigate('/EZERP/Orders');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create order');
        }
    };

    const handleCustomerSelect = (customerId: string) => {
        const selectedCustomer = customers.find(c => c._id === customerId);
        if (!selectedCustomer || !selectedCustomer.email || !selectedCustomer.address) {
            return;
        }

        const { address } = selectedCustomer;
        const customer: Order['customer'] = {
            _id: selectedCustomer._id,
            companyName: selectedCustomer.companyName,
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            phone: selectedCustomer.phone || '',
            address: {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zipCode: address.zipCode || ''
            }
        };

        setFormData(prev => ({
            ...prev,
            customer,
            shippingAddress: {
                street: address.street || '',
                city: address.city || '',
                state: address.state || '',
                country: address.country || '',
                zipCode: address.zipCode || ''
            }
        }));
    };

    const handleAddItem = () => {
        if (!newItem.productName || newItem.quantity <= 0 || newItem.price < 0) {
            setError('Please fill in all item fields with valid values');
            return;
        }

        // Generate a unique productId using timestamp and random string
        const productId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const updatedItems = [...(formData.items || []), {
            ...newItem,
            productId
        }];
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount
        }));

        setNewItem({
            productId: '',
            productName: '',
            quantity: 1,
            price: 0
        });
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...(formData.items || [])];
        updatedItems.splice(index, 1);
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount
        }));
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Create New Order</h2>
                <Button variant="secondary" onClick={() => navigate('/EZERP/Orders')}>
                    Back to Orders
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Order Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.orderNumber}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Status</Form.Label>
                                    <Form.Select
                                        value={formData.paymentStatus}
                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as Order['paymentStatus'] })}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="REFUNDED">Refunded</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Customer</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Form.Select
                                className="mt-2"
                                onChange={(e) => handleCustomerSelect(e.target.value)}
                                required
                            >
                                <option value="">Select a customer</option>
                                {filteredCustomers.map(customer => (
                                    <option key={customer._id} value={customer._id}>
                                        {customer.companyName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <h4 className="mt-4">Items</h4>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Product Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.productName}
                                        onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Quantity</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex align-items-end">
                                <Button variant="primary" onClick={handleAddItem}>
                                    Add Item
                                </Button>
                            </Col>
                        </Row>

                        {formData.items && formData.items.length > 0 && (
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Total</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>${item.price.toFixed(2)}</td>
                                            <td>${(item.quantity * item.price).toFixed(2)}</td>
                                            <td>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="text-end"><strong>Total Amount:</strong></td>
                                        <td colSpan={2}><strong>${formData.totalAmount?.toFixed(2)}</strong></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        )}

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" type="submit">
                                Create Order
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 