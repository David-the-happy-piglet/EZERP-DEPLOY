import { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Alert, Spinner, Container, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { inventoryRecordService, itemService } from '../services/api';

interface InventoryRecordProps {
    onBack: () => void;
}

interface InventoryRecord {
    _id: string;
    items: Array<{
        itemId: string;
        quantity: number;
    }>;
    type: 'in' | 'out';
    byUser: string;
    signed: boolean;
    signedBy?: string;
    description?: string;
    createdAt: string;
}

interface Item {
    _id: string;
    name: string;
    type: string;
    quantity: number;
    size?: string;
    standard?: string;
}

export default function InventoryRecord({ onBack }: InventoryRecordProps) {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [records, setRecords] = useState<InventoryRecord[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signingRecord, setSigningRecord] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
        fetchItems();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const response = await inventoryRecordService.getAll();
            let allRecords = (response.data as InventoryRecord[]) || [];

            // Filter records based on user role
            if (currentUser && !['ADMIN', 'PMANAGER', 'INVENTORY'].includes(currentUser.role)) {
                // Regular users can only see their own records
                allRecords = allRecords.filter((record: InventoryRecord) => 
                    record.byUser === currentUser.username
                );
            }

            // Sort by creation date (newest first)
            allRecords.sort((a: InventoryRecord, b: InventoryRecord) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setRecords(allRecords);
        } catch (err: any) {
            console.error('Failed to fetch inventory records:', err);
            setError('加载库存记录失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const response = await itemService.getAll();
            setItems((response.data as Item[]) || []);
        } catch (err: any) {
            console.error('Failed to fetch items:', err);
        }
    };

    const handleSignRecord = async (recordId: string) => {
        if (!currentUser || !currentUser.username) {
            setError('用户信息不可用');
            return;
        }

        try {
            setSigningRecord(recordId);
            
            // Update the record to signed
            await inventoryRecordService.update(recordId, {
                signed: true,
                signedBy: currentUser.username
            });

            // Update item quantities
            const record = records.find(r => r._id === recordId);
            if (record) {
                for (const item of record.items) {
                    const itemData = items.find(i => i._id === item.itemId);
                    if (itemData) {
                        const newQuantity = record.type === 'in' 
                            ? itemData.quantity + item.quantity
                            : itemData.quantity - item.quantity;
                        
                        await itemService.update(item.itemId, {
                            quantity: Math.max(0, newQuantity) // Ensure quantity doesn't go below 0
                        });
                    }
                }
            }

            // Refresh records and items
            await fetchRecords();
            await fetchItems();
            
        } catch (err: any) {
            console.error('Failed to sign record:', err);
            setError('确认记录失败，请重试');
        } finally {
            setSigningRecord(null);
        }
    };

    const getItemName = (itemId: string) => {
        const item = items.find(i => i._id === itemId);
        return item ? item.name : '未知物品';
    };

    const getTypeBadge = (type: 'in' | 'out') => {
        return type === 'in' 
            ? <Badge bg="success">入库</Badge>
            : <Badge bg="warning">出库</Badge>;
    };

    const getStatusBadge = (signed: boolean) => {
        return signed 
            ? <Badge bg="success">已确认</Badge>
            : <Badge bg="secondary">待确认</Badge>;
    };

    const canSign = currentUser && currentUser.role === 'INVENTORY';

    if (loading) {
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
                    <h3 className="mb-0">📋 库存记录</h3>
                    <div>
                        <Button variant="outline-secondary" onClick={fetchRecords} className="me-2">
                            刷新
                        </Button>
                        <Button variant="outline-secondary" onClick={onBack}>
                            返回
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {records.length === 0 ? (
                        <Alert variant="info">没有找到库存记录</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>记录ID</th>
                                    <th>类型</th>
                                    <th>操作人</th>
                                    <th>物品详情</th>
                                    <th>状态</th>
                                    <th>确认人</th>
                                    <th>创建时间</th>
                                    <th>备注</th>
                                    {canSign && <th>操作</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record._id}>
                                        <td>
                                            <code>{record._id}</code>
                                        </td>
                                        <td>{getTypeBadge(record.type)}</td>
                                        <td>{record.byUser}</td>
                                        <td>
                                            <div>
                                                {record.items.map((item, index) => (
                                                    <div key={index} className="small">
                                                        <strong>{getItemName(item.itemId)}</strong>
                                                        <span className="text-muted"> x {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td>{getStatusBadge(record.signed)}</td>
                                        <td>
                                            {record.signed ? record.signedBy : '-'}
                                        </td>
                                        <td>
                                            {new Date(record.createdAt).toLocaleString()}
                                        </td>
                                        <td>
                                            {record.description || '-'}
                                        </td>
                                        {canSign && (
                                            <td>
                                                {!record.signed ? (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleSignRecord(record._id)}
                                                        disabled={signingRecord === record._id}
                                                    >
                                                        {signingRecord === record._id ? (
                                                            <>
                                                                <Spinner animation="border" size="sm" className="me-1" />
                                                                确认中...
                                                            </>
                                                        ) : (
                                                            '确认'
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Badge bg="success">已确认</Badge>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}

                    {/* Summary */}
                    <Row className="mt-4">
                        <Col md={6}>
                            <Card className="bg-light">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">权限说明：</h6>
                                    <ul className="mb-0 small text-muted">
                                        <li><strong>所有用户</strong>：可以看到自己创建的记录</li>
                                        <li><strong>ADMIN, PMANAGER, INVENTORY</strong>：可以看到所有记录</li>
                                        <li><strong>INVENTORY</strong>：可以确认记录，确认后才会更新实际库存</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="bg-light">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">记录状态：</h6>
                                    <ul className="mb-0 small text-muted">
                                        <li><Badge bg="secondary" className="me-1">待确认</Badge>：记录已创建，等待INVENTORY确认</li>
                                        <li><Badge bg="success" className="me-1">已确认</Badge>：记录已确认，库存已更新</li>
                                    </ul>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
}
