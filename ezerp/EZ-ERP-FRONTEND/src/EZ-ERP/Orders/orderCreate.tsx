import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Card, Row, Col, Alert, Table, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { orderService, customerService, itemService } from '../services/api';
import type { Order, Customer } from '../types';

export default function OrderCreate() {
    const navigate = useNavigate();
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        orderNumber: '',
        customerId: '',
        description: '',
        items: [] as Array<{
            itemId: string;
            quantity: number;
            price: number;
        }>,
        totalAmount: 0,
        status: 'PENDING' as 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
        paymentStatus: 'PENDING' as 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
        shippingAddress: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        },
        dueDate: new Date().toISOString(),
        notes: '',
        isRework: false,
        reworkReason: '',
        reworkOrderNumber: '',
        orderImage: ''
    });
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

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Check if user has permission to create orders
    const canCreateOrder = currentUser && ['ADMIN', 'MKT', 'PMANAGER'].includes(currentUser.role);

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
        if (!formData.orderNumber || !formData.customerId || !formData.items || formData.items.length === 0 || !formData.dueDate || !formData.shippingAddress.street) {
            setError('请填写所有必填项并至少添加一件商品');
            return;
        }
        try {
            const orderData = {
                orderNumber: formData.orderNumber,
                customerId: formData.customerId,
                description: formData.description,
                items: formData.items,
                totalAmount: formData.totalAmount,
                status: formData.status,
                paymentStatus: formData.paymentStatus,
                shippingAddress: formData.shippingAddress.street,
                dueDate: new Date(formData.dueDate).toISOString(),
                notes: formData.notes,
                isRework: formData.isRework,
                reworkReason: formData.reworkReason,
                reworkOrderNumber: formData.reworkOrderNumber,
                orderImage: formData.orderImage
            };
            await orderService.create(orderData);
            navigate('/EZERP/Orders');
        } catch (err: any) {
            setError(err.response?.data?.message || '创建订单失败');
        }
    };

    const handleCustomerSelect = (customerId: string) => {
        const selectedCustomer = customers.find(c => c._id === customerId);
        if (!selectedCustomer) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            customerId: selectedCustomer._id,
            shippingAddress: {
                street: selectedCustomer.address || '',
                city: '',
                state: '',
                country: '',
                zipCode: ''
            }
        }));
    };

    const handleAddItem = () => {
        if (!newItem.itemName || newItem.quantity <= 0 || newItem.price < 0) {
            setError('请完整填写商品信息并确保数值有效');
            return;
        }

        // Generate a unique itemId using timestamp and random string
        const itemId = `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const updatedItems = [...formData.items, {
            itemId,
            quantity: newItem.quantity,
            price: newItem.price
        }];
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount
        }));

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

        try {
            const itemData = {
                name: newItem.itemName,
                type: newItem.itemType,
                quantity: 0, // Default quantity as per schema
                price: undefined, // Default price as empty per schema
                size: newItem.size,
                standard: newItem.standard,
                description: newItem.description,
                orderNumber: formData.orderNumber || ''
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
        if (!editingItem) return;

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
            const orderItemIndex = formData.items.findIndex(item => item.itemId === editingItem._id);
            if (orderItemIndex !== -1) {
                const updatedOrderItems = [...formData.items];
                updatedOrderItems[orderItemIndex] = {
                    ...updatedOrderItems[orderItemIndex],
                    quantity: newItem.quantity,
                    price: newItem.price
                };
                
                const totalAmount = updatedOrderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                
                setFormData(prev => ({
                    ...prev,
                    items: updatedOrderItems,
                    totalAmount
                }));
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
        const updatedItems = [...formData.items, {
            itemId: item._id,
            quantity: item.quantity,
            price: item.price || 0
        }];
        const totalAmount = updatedItems.reduce((sum, orderItem) => sum + (orderItem.quantity * orderItem.price), 0);

        setFormData(prev => ({
            ...prev,
            items: updatedItems,
            totalAmount
        }));
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = [...formData.items];
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

    // Show access denied message if user doesn't have permission
    if (!canCreateOrder) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>新建订单</h2>
                    <Button variant="secondary" onClick={() => navigate('/EZERP/Orders')}>
                        返回订单列表
                    </Button>
                </div>
                <Card>
                    <Card.Body className="text-center">
                        <Alert variant="warning">
                            <h4>权限不足</h4>
                            <p>只有 ADMIN、MKT 和 PMANAGER 角色可以创建订单</p>
                            <p className="text-muted">当前用户角色: {currentUser?.role || '未登录'}</p>
                        </Alert>
                    </Card.Body>
                </Card>
            </div>
        );
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
                                    <Form.Label>订单号*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.orderNumber}
                                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                        placeholder="请输入订单号"
                                        required
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
                            <Form.Label>备注</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="可选备注信息"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="返工订单"
                                        checked={formData.isRework}
                                        onChange={(e) => setFormData({ ...formData, isRework: e.target.checked })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                {formData.isRework && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>返工原因</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.reworkReason}
                                            onChange={(e) => setFormData({ ...formData, reworkReason: e.target.value })}
                                            placeholder="请输入返工原因"
                                        />
                                    </Form.Group>
                                )}
                            </Col>
                        </Row>

                        {formData.isRework && (
                            <Form.Group className="mb-3">
                                <Form.Label>原订单号</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.reworkOrderNumber}
                                    onChange={(e) => setFormData({ ...formData, reworkOrderNumber: e.target.value })}
                                    placeholder="请输入原订单号"
                                />
                            </Form.Group>
                        )}

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
                                value={formData.customerId}
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

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>街道*</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.shippingAddress.street}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, street: e.target.value } })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>城市</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.shippingAddress.city}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, city: e.target.value } })}
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
                                        value={formData.shippingAddress.state}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, state: e.target.value } })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>国家</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.shippingAddress.country}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, country: e.target.value } })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>邮编</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.shippingAddress.zipCode}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: { ...formData.shippingAddress, zipCode: e.target.value } })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h4 className="mt-4">商品明细</h4>
                        
                        {/* Quick Add Section */}
                        <Card className="mb-3">
                            <Card.Header>
                                <h5>快速添加商品到订单</h5>
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
                                    <h5>已创建的商品</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Table striped bordered hover>
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

                        {formData.items && formData.items.length > 0 && (
                            <Table striped bordered hover className="mt-3">
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
                                    {formData.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.itemId}</td>
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