import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Row, Col, Alert, Table } from 'react-bootstrap';
import { orderService, customerService } from '../services/api';
import type { Order, Customer } from '../types';
import { useSelector } from 'react-redux';
import { hasAnyRole, Role } from '../utils/roles';

export default function OrderEdit() {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageOrders = hasAnyRole(currentUser, Role.ADMIN, Role.MKT);

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
            setError(err.response?.data?.message || '获取订单详情失败');
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            setCustomers(response.data as Customer[]);
        } catch (err: any) {
            setError(err.response?.data?.message || '获取客户列表失败');
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
            setError(err.response?.data?.message || '更新订单失败');
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
        return <div className="container mt-4">加载中...</div>;
    }

    if (!order) {
        return <div className="container mt-4">未找到订单</div>;
    }

    if (!canManageOrders) {
        return <div className="container mt-4">您没有权限编辑订单</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>编辑订单</h2>
                <Button variant="secondary" onClick={() => navigate(`/EZERP/Orders/${orderNumber}`)}>
                    返回订单详情
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>订单号</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={order.orderNumber}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>交付日期</Form.Label>
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
                                    <Form.Label>状态</Form.Label>
                                    <Form.Select
                                        value={order.status}
                                        onChange={(e) => setOrder({ ...order, status: e.target.value as Order['status'] })}
                                    >
                                        <option value="PENDING">待处理</option>
                                        <option value="PROCESSING">处理中</option>
                                        <option value="SHIPPED">已发货</option>
                                        <option value="DELIVERED">已送达</option>
                                        <option value="CANCELLED">已取消</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>付款状态</Form.Label>
                                    <Form.Select
                                        value={order.paymentStatus}
                                        onChange={(e) => setOrder({ ...order, paymentStatus: e.target.value as Order['paymentStatus'] })}
                                    >
                                        <option value="PENDING">待支付</option>
                                        <option value="PAID">已支付</option>
                                        <option value="FAILED">失败</option>
                                        <option value="REFUNDED">已退款</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>客户</Form.Label>
                                    <Form.Select
                                        value={order.customer._id}
                                        onChange={(e) => handleCustomerSelect(e.target.value)}
                                    >
                                        <option value="">选择客户</option>
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
                                <h5>收货地址</h5>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>街道</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.street}
                                                onChange={(e) => handleAddressChange('street', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>城市</Form.Label>
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
                                            <Form.Label>省/州</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.state}
                                                onChange={(e) => handleAddressChange('state', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>国家</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={order.shippingAddress.country}
                                                onChange={(e) => handleAddressChange('country', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>邮编</Form.Label>
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
                                <h5>商品明细</h5>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>商品</th>
                                            <th>数量</th>
                                            <th>单价</th>
                                            <th>小计</th>
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
                                    <Form.Label>备注</Form.Label>
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
                                    保存修改
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 