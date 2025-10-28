import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Row, Col, Alert, Table, Modal } from 'react-bootstrap';
import { orderService, customerService, itemService } from '../services/api';
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
    const [newItem, setNewItem] = useState({
        itemId: '',
        itemName: '',
        itemType: 'MATERIAL',
        quantity: 1,
        price: 0,
        size: '',
        standard: '',
        description: ''
    });
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [createdItems, setCreatedItems] = useState<any[]>([]);
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
                // Only send fields allowed by service types
                orderNumber: order.orderNumber,
                description: order.description,
                items: order.items,
                totalAmount: order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
                status: order.status,
                paymentStatus: order.paymentStatus,
                dueDate: new Date(order.dueDate).toISOString(),
                shippingAddress: order.shippingAddress.street,
                notes: order.notes
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

    const handleAddItem = () => {
        if (!newItem.itemName || newItem.quantity <= 0 || newItem.price < 0) {
            setError('请完整填写商品信息并确保数值有效');
            return;
        }

        if (!order) return;

        // Generate a unique itemId using timestamp and random string
        const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const updatedItems = [...order.items, {
            itemId,
            quantity: newItem.quantity,
            price: newItem.price
        }];
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        setOrder({
            ...order,
            items: updatedItems,
            totalAmount
        });

        setNewItem({
            itemId: '',
            itemName: '',
            itemType: 'MATERIAL',
            quantity: 1,
            price: 0,
            size: '',
            standard: '',
            description: ''
        });
    };

    const handleCreateItem = async () => {
        if (!newItem.itemName || !newItem.itemType) {
            setError('请填写商品名称和类型');
            return;
        }

        if (!order) return;

        try {
            const itemData = {
                name: newItem.itemName,
                type: newItem.itemType,
                quantity: 0, // Default quantity as per schema
                price: undefined, // Default price as empty per schema
                size: newItem.size,
                standard: newItem.standard,
                description: newItem.description,
                orderNumber: order.orderNumber
            };

            if (newItem.itemType === 'PRODUCT') {
                // Create both PRODUCT and SEMI_PRODUCT items
                const productItem = await itemService.create({
                    ...itemData,
                    type: 'PRODUCT'
                });
                
                const semiproductItem = await itemService.create({
                    ...itemData,
                    type: 'SEMI_PRODUCT'
                });

                setCreatedItems(prev => [...prev, productItem.data, semiproductItem.data]);
            } else {
                const createdItem = await itemService.create(itemData);
                setCreatedItems(prev => [...prev, createdItem.data]);
            }

            setShowItemModal(false);
            setNewItem({
                itemId: '',
                itemName: '',
                itemType: 'MATERIAL',
                quantity: 1,
                price: 0,
                size: '',
                standard: '',
                description: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || '创建商品失败');
        }
    };

    const handleEditItem = (item: any) => {
        setEditingItem(item);
        setNewItem({
            itemId: item._id,
            itemName: item.name,
            itemType: item.type,
            quantity: item.quantity,
            price: item.price || 0,
            size: item.size || '',
            standard: item.standard || '',
            description: item.description || ''
        });
        setShowItemModal(true);
    };

    const handleUpdateItem = async () => {
        if (!editingItem || !order) return;

        try {
            const updateData = {
                name: newItem.itemName,
                type: newItem.itemType,
                quantity: newItem.quantity,
                price: newItem.price,
                size: newItem.size,
                standard: newItem.standard,
                description: newItem.description
            };

            await itemService.update(editingItem._id, updateData);

            // Update created items list
            setCreatedItems(prev => prev.map(item => 
                item._id === editingItem._id ? { ...item, ...updateData } : item
            ));

            // If quantity or price changed, update order items
            const orderItemIndex = order.items.findIndex(item => item.itemId === editingItem._id);
            if (orderItemIndex !== -1) {
                const updatedOrderItems = [...order.items];
                updatedOrderItems[orderItemIndex] = {
                    ...updatedOrderItems[orderItemIndex],
                    quantity: newItem.quantity,
                    price: newItem.price
                };
                
                const totalAmount = updatedOrderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                
                setOrder({
                    ...order,
                    items: updatedOrderItems,
                    totalAmount
                });
            }

            setShowItemModal(false);
            setEditingItem(null);
            setNewItem({
                itemId: '',
                itemName: '',
                itemType: 'MATERIAL',
                quantity: 1,
                price: 0,
                size: '',
                standard: '',
                description: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || '更新商品失败');
        }
    };

    const handleAddExistingItem = (item: any) => {
        if (!order) return;

        const updatedItems = [...order.items, {
            itemId: item._id,
            quantity: item.quantity,
            price: item.price || 0
        }];
        const totalAmount = updatedItems.reduce((sum, orderItem) => sum + (orderItem.quantity * orderItem.price), 0);

        setOrder({
            ...order,
            items: updatedItems,
            totalAmount
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
                    email: '', // No email field in customer schema
                    phone: selectedCustomer.phone || '',
                    address: {
                        street: selectedCustomer.address || '', // Use string address as street
                        city: '',
                        state: '',
                        country: '',
                        zipCode: ''
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
                                
                                {/* Quick Add Section */}
                                <Card className="mb-3">
                                    <Card.Header>
                                        <h6>快速添加商品到订单</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>商品名称</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={newItem.itemName}
                                                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                                                        placeholder="输入商品名称"
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
                                            <Col md={4} className="d-flex align-items-end gap-2">
                                                <Button variant="primary" onClick={handleAddItem}>
                                                    添加到订单
                                                </Button>
                                                <Button variant="success" onClick={() => setShowItemModal(true)}>
                                                    创建新商品
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                {/* Created Items Section */}
                                {createdItems.length > 0 && (
                                    <Card className="mb-3">
                                        <Card.Header>
                                            <h6>已创建的商品</h6>
                                        </Card.Header>
                                        <Card.Body>
                                            <Table striped bordered hover size="sm">
                                                <thead>
                                                    <tr>
                                                        <th>商品名称</th>
                                                        <th>类型</th>
                                                        <th>尺寸</th>
                                                        <th>标准</th>
                                                        <th>数量</th>
                                                        <th>单价</th>
                                                        <th>操作</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {createdItems.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{item.name}</td>
                                                            <td>{item.type}</td>
                                                            <td>{item.size || '-'}</td>
                                                            <td>{item.standard || '-'}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>${(item.price || 0).toFixed(2)}</td>
                                                            <td>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="me-1"
                                                                    onClick={() => handleEditItem(item)}
                                                                >
                                                                    编辑
                                                                </Button>
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    onClick={() => handleAddExistingItem(item)}
                                                                >
                                                                    添加到订单
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </Card.Body>
                                    </Card>
                                )}

                                {/* Order Items Table */}
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>商品ID</th>
                                            <th>数量</th>
                                            <th>单价</th>
                                            <th>小计</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={item.itemId}
                                                        onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
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
                                                <td>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            const updatedItems = order.items.filter((_, i) => i !== index);
                                                            const totalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                                                            setOrder({ ...order, items: updatedItems, totalAmount });
                                                        }}
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
                                            <td colSpan={2}><strong>${order.totalAmount.toFixed(2)}</strong></td>
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

            {/* Item Creation/Edit Modal */}
            <Modal show={showItemModal} onHide={() => setShowItemModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? '编辑商品' : '创建新商品'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>商品名称*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.itemName}
                                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                                        placeholder="输入商品名称"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>商品类型*</Form.Label>
                                    <Form.Select
                                        value={newItem.itemType}
                                        onChange={(e) => setNewItem({ ...newItem, itemType: e.target.value })}
                                        required
                                    >
                                        <option value="MATERIAL">材料</option>
                                        <option value="PRODUCT">产品</option>
                                        <option value="SEMI_PRODUCT">半成品</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>尺寸</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.size}
                                        onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                        placeholder="输入尺寸信息"
                                        required={newItem.itemType === 'PRODUCT' || newItem.itemType === 'SEMI_PRODUCT'}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>标准</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.standard}
                                        onChange={(e) => setNewItem({ ...newItem, standard: e.target.value })}
                                        placeholder="输入标准信息"
                                        required={newItem.itemType === 'PRODUCT'}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>数量</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                                        placeholder="数据库默认数量"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>单价</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                                        placeholder="数据库默认价格"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>描述</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="输入商品描述"
                            />
                        </Form.Group>

                        <Alert variant="info">
                            <strong>注意：</strong>
                            <ul className="mb-0 mt-2">
                                <li>订单号将自动设置为当前订单的订单号</li>
                                <li>数据库中的默认数量为0，默认价格为空</li>
                                <li>选择"产品"类型时，将同时创建产品和半成品两个商品</li>
                                <li>编辑商品时，修改数量和价格会同步更新订单信息</li>
                            </ul>
                        </Alert>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowItemModal(false)}>
                        取消
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={editingItem ? handleUpdateItem : handleCreateItem}
                        disabled={!newItem.itemName || !newItem.itemType}
                    >
                        {editingItem ? '更新商品' : '创建商品'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 