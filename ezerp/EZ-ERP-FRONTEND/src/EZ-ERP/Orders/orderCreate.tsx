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
            setError('生成订单号失败');
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            setCustomers(response.data as Customer[]);
            setFilteredCustomers(response.data as Customer[]);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || '获取客户列表失败');
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.orderNumber || !formData.customer || !formData.items || formData.items.length === 0 || !formData.dueDate || !formData.shippingAddress) {
            setError('请填写所有必填项并至少添加一件商品');
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
            setError(err.response?.data?.message || '创建订单失败');
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
            setError('请完整填写商品信息并确保数值有效');
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
        return <div className="container mt-4">加载中...</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>新建订单</h2>
                <Button variant="secondary" onClick={() => navigate('/EZERP/Orders')}>
                    返回订单列表
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
                                        value={formData.orderNumber}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>交付日期</Form.Label>
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
                                    <Form.Label>状态</Form.Label>
                                    <Form.Select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
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
                                        value={formData.paymentStatus}
                                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as Order['paymentStatus'] })}
                                    >
                                        <option value="PENDING">待支付</option>
                                        <option value="PAID">已支付</option>
                                        <option value="FAILED">失败</option>
                                        <option value="REFUNDED">已退款</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>描述</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>客户</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="搜索客户..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Form.Select
                                className="mt-2"
                                onChange={(e) => handleCustomerSelect(e.target.value)}
                                required
                            >
                                <option value="">选择客户</option>
                                {filteredCustomers.map(customer => (
                                    <option key={customer._id} value={customer._id}>
                                        {customer.companyName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <h4 className="mt-4">商品明细</h4>
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>商品名称</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.productName}
                                        onChange={(e) => setNewItem({ ...newItem, productName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>数量</Form.Label>
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
                                    <Form.Label>单价</Form.Label>
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
                                    添加商品
                                </Button>
                            </Col>
                        </Row>

                        {formData.items && formData.items.length > 0 && (
                            <Table striped bordered hover className="mt-3">
                                <thead>
                                    <tr>
                                        <th>商品名称</th>
                                        <th>数量</th>
                                        <th>单价</th>
                                        <th>小计</th>
                                        <th>操作</th>
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
                                                    移除
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="text-end"><strong>总金额：</strong></td>
                                        <td colSpan={2}><strong>${formData.totalAmount?.toFixed(2)}</strong></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        )}

                        <div className="d-flex justify-content-end mt-4">
                            <Button variant="primary" type="submit">
                                创建订单
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 