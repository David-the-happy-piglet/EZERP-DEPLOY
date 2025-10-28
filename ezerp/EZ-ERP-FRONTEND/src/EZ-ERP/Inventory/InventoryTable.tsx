import { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Alert, Spinner, Container, Row, Col, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { itemService } from '../services/api';

interface InventoryTableProps {
    onBack: () => void;
}

interface Item {
    _id: string;
    name: string;
    type: string;
    quantity: number;
    price?: number;
    size?: string;
    standard?: string;
    description?: string;
    createdAt: string;
}

type SortField = 'name' | 'type' | 'quantity' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function InventoryTable({ onBack }: InventoryTableProps) {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [items, setItems] = useState<Item[]>([]);
    const [filteredItems, setFilteredItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Check if user has permission to view stock
    const canViewStock = currentUser && ['ADMIN', 'PMANAGER', 'INVENTORY'].includes(currentUser.role);

    useEffect(() => {
        if (canViewStock) {
            fetchItems();
        }
    }, [canViewStock]);

    useEffect(() => {
        filterAndSortItems();
    }, [items, searchTerm, typeFilter, sortField, sortDirection]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await itemService.getAll();
            setItems((response.data as Item[]) || []);
        } catch (err: any) {
            console.error('Failed to fetch items:', err);
            setError('加载库存数据失败');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortItems = () => {
        let filtered = [...items];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                case 'quantity':
                    aValue = a.quantity;
                    bValue = b.quantity;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredItems(filtered);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'PRODUCT':
                return <Badge bg="success">产品</Badge>;
            case 'MATERIAL':
                return <Badge bg="primary">原料</Badge>;
            case 'SEMI_PRODUCT':
                return <Badge bg="warning">半成品</Badge>;
            default:
                return <Badge bg="secondary">{type}</Badge>;
        }
    };

    const getQuantityBadge = (quantity: number) => {
        if (quantity === 0) {
            return <Badge bg="danger">缺货</Badge>;
        } else if (quantity < 10) {
            return <Badge bg="warning">库存不足</Badge>;
        } else {
            return <Badge bg="success">{quantity}</Badge>;
        }
    };

    const getUniqueTypes = () => {
        const types = [...new Set(items.map(item => item.type))];
        return types;
    };


    const getTotalItems = () => {
        return filteredItems.reduce((total, item) => total + item.quantity, 0);
    };

    if (!canViewStock) {
        return (
            <Container className="mt-4">
                <Card>
                    <Card.Body className="text-center">
                        <Alert variant="warning">
                            <h4>权限不足</h4>
                            <p>只有 ADMIN、PMANAGER 和 INVENTORY 角色可以查看库存信息</p>
                            <Button variant="outline-secondary" onClick={onBack}>
                                返回
                            </Button>
                        </Alert>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

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
                    <h3 className="mb-0">📊 库存状态</h3>
                    <div>
                        <Button variant="outline-secondary" onClick={fetchItems} className="me-2">
                            刷新
                        </Button>
                        <Button variant="outline-secondary" onClick={onBack}>
                            返回
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    {/* Summary Cards */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <Card className="bg-primary text-white">
                                <Card.Body className="text-center">
                                    <h4>{filteredItems.length}</h4>
                                    <p className="mb-0">物品种类</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="bg-success text-white">
                                <Card.Body className="text-center">
                                    <h4>{getTotalItems()}</h4>
                                    <p className="mb-0">总数量</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="bg-warning text-white">
                                <Card.Body className="text-center">
                                    <h4>{filteredItems.filter(item => item.quantity === 0).length}</h4>
                                    <p className="mb-0">缺货物品</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Row className="mb-4">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>搜索物品</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="按名称、ID或描述搜索..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>物品类型</Form.Label>
                                <Form.Select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="">所有类型</option>
                                    {getUniqueTypes().map(type => (
                                        <option key={type} value={type}>
                                            {type === 'PRODUCT' ? '产品' : 
                                             type === 'MATERIAL' ? '原料' : 
                                             type === 'SEMI_PRODUCT' ? '半成品' : type}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Items Table */}
                    {filteredItems.length === 0 ? (
                        <Alert variant="info">没有找到匹配的物品</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th 
                                        onClick={() => handleSort('name')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        物品名称{getSortIcon('name')}
                                    </th>
                                    <th 
                                        onClick={() => handleSort('type')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        类型{getSortIcon('type')}
                                    </th>
                                    <th 
                                        onClick={() => handleSort('quantity')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        库存数量{getSortIcon('quantity')}
                                    </th>
                                    <th>规格</th>
                                    <th>标准</th>
                                    <th>单价</th>
                                    <th 
                                        onClick={() => handleSort('createdAt')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        创建时间{getSortIcon('createdAt')}
                                    </th>
                                    <th>描述</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>
                                            <div>
                                                <strong>{item.name}</strong>
                                                <br />
                                                <small className="text-muted">{item._id}</small>
                                            </div>
                                        </td>
                                        <td>{getTypeBadge(item.type)}</td>
                                        <td>{getQuantityBadge(item.quantity)}</td>
                                        <td>{item.size || '-'}</td>
                                        <td>{item.standard || '-'}</td>
                                        <td>{item.price ? `¥${item.price.toLocaleString()}` : '-'}</td>
                                        <td>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {item.description ? (
                                                <span title={item.description}>
                                                    {item.description.length > 50 
                                                        ? `${item.description.substring(0, 50)}...` 
                                                        : item.description}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
