import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col, Alert, Badge, Table, Modal } from 'react-bootstrap';
import { orderService } from '../services/api';
import type { Order } from '../types';
import { useSelector } from 'react-redux';

export default function OrderDetails() {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageOrders = currentUser?.role === 'ADMIN' || currentUser?.role === 'MKT';

    useEffect(() => {
        fetchOrderDetails();
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

    const handleDelete = async () => {
        try {
            await orderService.delete(order!._id);
            navigate('/EZERP/Orders');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete order');
        }
    };

    const handleEdit = () => {
        navigate(`/EZERP/Orders/${orderNumber}/edit`);
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    if (!order) {
        return <div className="container mt-4">Order not found</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Order Details</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/EZERP/Orders')}>
                        Back to Orders
                    </Button>
                    {canManageOrders && (
                        <>
                            <Button variant="primary" className="me-2" onClick={handleEdit}>
                                Edit Order
                            </Button>
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                                Delete Order
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <h5>Order Information</h5>
                            <p><strong>Order Number:</strong> {order.orderNumber}</p>
                            <p><strong>Status:</strong> <Badge bg={order.status === 'DELIVERED' ? 'success' : 'primary'}>{order.status}</Badge></p>
                            <p><strong>Payment Status:</strong> <Badge bg={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>{order.paymentStatus}</Badge></p>
                            <p><strong>Due Date:</strong> {new Date(order.dueDate).toLocaleDateString()}</p>
                            <p><strong>Description:</strong> {order.description}</p>
                        </Col>
                        <Col md={6}>
                            <h5>Customer Information</h5>
                            <p><strong>Company:</strong> {order.customer.companyName}</p>
                            <p><strong>Contact:</strong> {order.customer.name}</p>
                            <p><strong>Email:</strong> {order.customer.email}</p>
                            <p><strong>Phone:</strong> {order.customer.phone}</p>
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
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>${item.price.toFixed(2)}</td>
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
                            <h5>Shipping Address</h5>
                            <p>
                                {order.shippingAddress.street}<br />
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                                {order.shippingAddress.country}
                            </p>
                        </Col>
                    </Row>

                    {order.notes && (
                        <Row className="mt-4">
                            <Col>
                                <h5>Notes</h5>
                                <p>{order.notes}</p>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete order {order?.orderNumber}? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 