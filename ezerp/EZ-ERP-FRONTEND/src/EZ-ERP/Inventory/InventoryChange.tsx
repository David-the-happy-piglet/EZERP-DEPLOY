import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Table, Container, Modal, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { inventoryRecordService, itemService, messageService } from '../services/api';

interface InventoryChangeProps {
    type: 'in' | 'out';
    onBack: () => void;
}

interface Item {
    _id: string;
    name: string;
    type: string;
    quantity: number;
    size?: string;
    standard?: string;
    description?: string;
    orderNumber?: string;
    price?: number;
    imagePath?: string;
}

interface InventoryItem {
    itemId: string;
    quantity: number;
}

export default function InventoryChange({ type, onBack }: InventoryChangeProps) {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [items, setItems] = useState<Item[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // For add item modal
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        type: 'MATERIAL',
        quantity: 1,
        size: '',
        standard: '',
        description: '',
        price: 0,
        orderNumber: ''
    });

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await itemService.getAll();
            setItems((response.data as Item[]) || []);
        } catch (err: any) {
            console.error('Failed to fetch items:', err);
            setError('加载物品列表失败');
        } finally {
            setLoading(false);
        }
    };

    const addInventoryItem = () => {
        setInventoryItems([...inventoryItems, { itemId: '', quantity: 1 }]);
    };

    const removeInventoryItem = (index: number) => {
        const newItems = inventoryItems.filter((_, i) => i !== index);
        setInventoryItems(newItems);
    };

    const updateInventoryItem = (index: number, field: 'itemId' | 'quantity', value: string | number) => {
        const newItems = [...inventoryItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setInventoryItems(newItems);
    };

    const handleSubmit = async () => {
        if (!currentUser || !currentUser.username) {
            setError('用户信息不可用');
            return;
        }

        // Validate form
        if (inventoryItems.length === 0) {
            setError('请至少添加一个物品');
            return;
        }

        const hasEmptyItems = inventoryItems.some(item => !item.itemId || item.quantity <= 0);
        if (hasEmptyItems) {
            setError('请填写所有物品信息，数量必须大于0');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Create inventory record
            const recordData = {
                items: inventoryItems,
                type: type,
                byUser: currentUser.username,
                description: description || undefined
            };

            await inventoryRecordService.create(recordData);

            // Create message notification
            const messageData = {
                messageType: 'others' as const,
                messageTitle: `${currentUser.username} 进行了${type === 'in' ? '入库' : '出库'}操作`,
                messageContent: `操作包含 ${inventoryItems.length} 个物品${description ? `，备注：${description}` : ''}`,
                postedBy: currentUser.username
            };

            await messageService.create(messageData);

            setSuccess(`${type === 'in' ? '入库' : '出库'}记录已创建，等待确认后生效`);
            
            // Reset form
            setInventoryItems([]);
            setDescription('');
            
            // Auto redirect after 2 seconds
            setTimeout(() => {
                onBack();
            }, 2000);

        } catch (err: any) {
            console.error('Failed to create inventory record:', err);
            setError('创建记录失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    const getItemCurrentStock = (itemId: string) => {
        const item = items.find(i => i._id === itemId);
        return item ? item.quantity : 0;
    };

    const isOutOfStock = (itemId: string, quantity: number) => {
        if (type === 'out') {
            const currentStock = getItemCurrentStock(itemId);
            return currentStock < quantity;
        }
        return false;
    };

    const handleAddNewItem = async () => {
        try {
            setLoading(true);
            setError(null);

            // Validate required fields based on item type
            if (!newItem.name || !newItem.type) {
                setError('物品名称和类型为必填项');
                return;
            }

            if ((newItem.type === 'PRODUCT' || newItem.type === 'SEMI_PRODUCT') && !newItem.size) {
                setError('产品和半成品必须填写尺寸');
                return;
            }

            if (newItem.type === 'PRODUCT' && !newItem.standard) {
                setError('产品必须填写标准');
                return;
            }

            if ((newItem.type === 'PRODUCT' || newItem.type === 'SEMI_PRODUCT') && !newItem.orderNumber) {
                setError('产品和半成品必须填写订单号');
                return;
            }

            const itemData = {
                name: newItem.name,
                type: newItem.type,
                quantity: newItem.quantity,
                price: newItem.price || undefined,
                description: newItem.description || undefined,
                orderNumber: newItem.orderNumber || undefined,
                size: newItem.size || undefined,
                standard: newItem.standard || undefined
            };

            const response = await itemService.create(itemData);
            const createdItem = response.data as Item;

            // Add the new item to inventory items
            setInventoryItems([...inventoryItems, { 
                itemId: createdItem._id, 
                quantity: newItem.quantity 
            }]);

            // Refresh items list
            await fetchItems();

            // Reset form and close modal
            setNewItem({
                name: '',
                type: 'MATERIAL',
                quantity: 1,
                size: '',
                standard: '',
                description: '',
                price: 0,
                orderNumber: ''
            });
            setShowAddItemModal(false);
            setSuccess('新物品已创建并添加到库存清单');

        } catch (err: any) {
            console.error('Failed to create item:', err);
            setError('创建物品失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    if (loading && items.length === 0) {
        return (
            <Container className="mt-4">
                <Card>
                    <Card.Body className="text-center">
                        <Spinner animation="border" />
                        <p className="mt-2">加载中...</p>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">
                        {type === 'in' ? '📥 入库操作' : '📤 出库操作'}
                    </h3>
                    <Button variant="outline-secondary" onClick={onBack}>
                        返回
                    </Button>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    {/* Items Selection */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>物品清单</h5>
                            <div>
                                <Button variant="outline-primary" onClick={addInventoryItem} className="me-2">
                                    添加现有物品
                                </Button>
                                {type === 'in' && (
                                    <Button variant="outline-success" onClick={() => setShowAddItemModal(true)}>
                                        创建新物品
                                    </Button>
                                )}
                            </div>
                        </div>

                        {inventoryItems.length === 0 ? (
                            <Alert variant="info">
                                请点击"添加物品"按钮开始添加物品
                            </Alert>
                        ) : (
                            <Table striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>物品</th>
                                        <th>当前库存</th>
                                        <th>{type === 'in' ? '入库数量' : '出库数量'}</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventoryItems.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <Form.Select
                                                    value={item.itemId}
                                                    onChange={(e) => updateInventoryItem(index, 'itemId', e.target.value)}
                                                >
                                                    <option value="">选择物品</option>
                                                    {items.map(itemOption => (
                                                        <option key={itemOption._id} value={itemOption._id}>
                                                            {itemOption.name} ({itemOption.type})
                                                            {itemOption.size && ` - ${itemOption.size}`}
                                                            {itemOption.standard && ` - ${itemOption.standard}`}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td>
                                                {item.itemId ? getItemCurrentStock(item.itemId) : '-'}
                                            </td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateInventoryItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className={isOutOfStock(item.itemId, item.quantity) ? 'border-danger' : ''}
                                                />
                                                {isOutOfStock(item.itemId, item.quantity) && (
                                                    <small className="text-danger d-block">
                                                        库存不足！
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => removeInventoryItem(index)}
                                                >
                                                    删除
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <Form.Group>
                            <Form.Label>备注说明</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="请输入备注说明（可选）"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>
                    </div>

                    {/* Submit Button */}
                    <div className="d-flex justify-content-between">
                        <Button variant="outline-secondary" onClick={onBack}>
                            取消
                        </Button>
                        <Button
                            variant={type === 'in' ? 'success' : 'warning'}
                            onClick={handleSubmit}
                            disabled={loading || inventoryItems.length === 0}
                        >
                            {loading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    提交中...
                                </>
                            ) : (
                                `提交${type === 'in' ? '入库' : '出库'}记录`
                            )}
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Add New Item Modal */}
            <Modal show={showAddItemModal} onHide={() => setShowAddItemModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>创建新物品</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>物品名称 *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="请输入物品名称"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>物品类型 *</Form.Label>
                                    <Form.Select
                                        value={newItem.type}
                                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                        required
                                    >
                                        <option value="MATERIAL">原材料</option>
                                        <option value="SEMI_PRODUCT">半成品</option>
                                        <option value="PRODUCT">产品</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>初始库存数量 *</Form.Label>
                            <Form.Control
                                type="number"
                                min="1"
                                value={newItem.quantity}
                                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                                required
                            />
                        </Form.Group>

                        {(newItem.type === 'PRODUCT' || newItem.type === 'SEMI_PRODUCT') && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>尺寸 *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newItem.size}
                                            onChange={(e) => setNewItem({ ...newItem, size: e.target.value })}
                                            placeholder="请输入尺寸"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>订单号 *</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={newItem.orderNumber}
                                            onChange={(e) => setNewItem({ ...newItem, orderNumber: e.target.value })}
                                            placeholder="请输入订单号"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {newItem.type === 'PRODUCT' && (
                            <Form.Group className="mb-3">
                                <Form.Label>标准 *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={newItem.standard}
                                    onChange={(e) => setNewItem({ ...newItem, standard: e.target.value })}
                                    placeholder="请输入标准"
                                    required
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>描述</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="请输入物品描述（可选）"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddItemModal(false)}>
                        取消
                    </Button>
                    <Button variant="success" onClick={handleAddNewItem} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                创建中...
                            </>
                        ) : (
                            '创建物品'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
