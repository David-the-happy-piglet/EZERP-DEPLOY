import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Row, Col, Alert, Table } from 'react-bootstrap';
import { orderService, customerService } from '../services/api';
import type { Order, Customer } from '../types';
import { useSelector } from 'react-redux';

export default function OrderEdit() {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageOrders = currentUser?.role === 'ADMIN' || currentUser?.role === 'MKT';

    useEffect(() => {
        fetchOrderDetails();
        fetchCustomers();
    }, [orderNumber]);

    const fetchOrderDetails = async () => {
        try {
            const response = await orderService.getByNumber(orderNumber!);
            setOrder(response.data as Order);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch order details');
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            setCustomers(response.data as Customer[]);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch customers');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        try {
            await orderService.update(order._id, {
                ...order,
                dueDate: new Date(order.dueDate).toISOString(),
                status: order.status,
                paymentStatus: order.paymentStatus,
                totalAmount: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
            });
            navigate(`/EZERP/Orders/${orderNumber}`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update order');
        }
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        if (!order) return;
        const updatedItems = [...order.items];
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };
        setOrder({
            ...order,
            items: updatedItems,
            totalAmount: updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
        });
    };

    const handleCustomerSelect = (customerId: string) => {
        if (!order) return;
        const selectedCustomer = customers.find(c => c._id === customerId);
        if (selectedCustomer) {
            setOrder({
                ...order,
                customer: {
                    _id: selectedCustomer._id || '',
                    companyName: selectedCustomer.companyName || '',
                    name: selectedCustomer.name || '',
                    email: selectedCustomer.email || '',
                    phone: selectedCustomer.phone || '',
                    address: {
                        street: selectedCustomer.address?.street || '',
                        city: selectedCustomer.address?.city || '',
                        state: selectedCustomer.address?.state || '',
                        country: selectedCustomer.address?.country || '',
                        zipCode: selectedCustomer.address?.zipCode || ''
                    }
                }
            });
        }
    };

    const handleAddressChange = (field: string, value: string) => {
        if (!order) return;
        setOrder({
            ...order,
            shippingAddress: {
                ...order.shippingAddress,
                [field]: value
            }
        });
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    if (!order) {
        return <div className="container mt-4">Order not found</div>;
    }

    if (!canManageOrders) {
        return <div className="container mt-4">You do not have permission to edit orders</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Edit Order</h2>
                <Button variant="secondary" onClick={() => navigate(`/EZERP/Orders/${orderNumber}`)}>
                    Back to Order Details
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
                                        value={order.orderNumber}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={new Date(order.dueDate).toISOString().split('T')[0]}
                                        onChange={(e) => setOrder({ ...order, dueDate: e.target.value })}
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
                                        value={order.status}
                                        onChange={(e) => setOrder({ ...order, status: e.target.value as Order['status'] })}
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
                                        value={order.paymentStatus}
                                        onChange={(e) => setOrder({ ...order, paymentStatus: e.target.value as Order['paymentStatus'] })}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="REFUNDED">Refunded</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Customer</Form.Label>
                                    <Form.Select
                                        value={order.customer._id}
                                        onChange={(e) => handleCustomerSelect(e.target.value)}
                                    >
                                        <option value="">Select a customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer._id} value={customer._id}>
                                                {customer.companyName} - {customer.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>
                                <h5>Shipping Address</h5>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Street</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.street}
                                                onChange={(e) => handleAddressChange('street', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>City</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.city}
                                                onChange={(e) => handleAddressChange('city', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>State</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.state}
                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Country</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.country}
                                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ZIP Code</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.zipCode}
                                                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <h5>Items</h5>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={item.productName}
                                                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.price}
                                                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td>${(item.quantity * item.price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="text-end"><strong>Total Amount:</strong></td>
                                            <td><strong>${order.totalAmount.toFixed(2)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Notes</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={order.notes || ''}
                                        onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-4">
                            <Col>
                                <Button type="submit" variant="primary">
                                    Save Changes
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 