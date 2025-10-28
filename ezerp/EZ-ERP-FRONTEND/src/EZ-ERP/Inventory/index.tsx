import { useState } from 'react';
import { Card, Button, Row, Col, Container } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import InventoryChange from './InventoryChange';
import InventoryRecord from './InventoryRecord';
import InventoryTable from './InventoryTable';

export default function Inventory() {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [activeView, setActiveView] = useState<string | null>(null);

    // Check permissions
    const canViewStock = currentUser && ['ADMIN', 'PMANAGER', 'INVENTORY'].includes(currentUser.role);
    const canViewRecords = currentUser && ['ADMIN', 'PMANAGER', 'INVENTORY'].includes(currentUser.role);

    const handleViewChange = (view: string) => {
        setActiveView(view);
    };

    const handleBackToMain = () => {
        setActiveView(null);
    };

    // If a specific view is active, render that component
    if (activeView === 'in') {
        return <InventoryChange type="in" onBack={handleBackToMain} />;
    }
    if (activeView === 'out') {
        return <InventoryChange type="out" onBack={handleBackToMain} />;
    }
    if (activeView === 'records') {
        return <InventoryRecord onBack={handleBackToMain} />;
    }
    if (activeView === 'stock') {
        return <InventoryTable onBack={handleBackToMain} />;
    }

    // Main inventory dashboard
    return (
        <Container className="mt-4">
            <Card>
                <Card.Header>
                    <h2 className="mb-0">库存管理</h2>
                </Card.Header>
                <Card.Body>
                    <Row className="g-4">
                        {/* 入库按钮 */}
                        <Col md={6} lg={3}>
                            <Card className="h-100 text-center">
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <div className="mb-3">
                                        <span className="fs-1 text-success">📥</span>
                                    </div>
                                    <h5 className="card-title">入库</h5>
                                    <p className="card-text text-muted">添加物品到库存</p>
                                    <Button 
                                        variant="success" 
                                        onClick={() => handleViewChange('in')}
                                        className="mt-auto"
                                    >
                                        开始入库
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* 出库按钮 */}
                        <Col md={6} lg={3}>
                            <Card className="h-100 text-center">
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <div className="mb-3">
                                        <span className="fs-1 text-warning">📤</span>
                                    </div>
                                    <h5 className="card-title">出库</h5>
                                    <p className="card-text text-muted">从库存中移除物品</p>
                                    <Button 
                                        variant="warning" 
                                        onClick={() => handleViewChange('out')}
                                        className="mt-auto"
                                    >
                                        开始出库
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* 查看库存按钮 */}
                        <Col md={6} lg={3}>
                            <Card className="h-100 text-center">
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <div className="mb-3">
                                        <span className="fs-1 text-primary">📊</span>
                                    </div>
                                    <h5 className="card-title">查看库存</h5>
                                    <p className="card-text text-muted">查看当前库存状态</p>
                                    <Button 
                                        variant="primary" 
                                        onClick={() => handleViewChange('stock')}
                                        className="mt-auto"
                                        disabled={!canViewStock}
                                    >
                                        {canViewStock ? '查看库存' : '无权限'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* 查看库存记录按钮 */}
                        <Col md={6} lg={3}>
                            <Card className="h-100 text-center">
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    <div className="mb-3">
                                        <span className="fs-1 text-info">📋</span>
                                    </div>
                                    <h5 className="card-title">查看记录</h5>
                                    <p className="card-text text-muted">查看出入库记录</p>
                                    <Button 
                                        variant="info" 
                                        onClick={() => handleViewChange('records')}
                                        className="mt-auto"
                                        disabled={!canViewRecords}
                                    >
                                        {canViewRecords ? '查看记录' : '无权限'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* 权限说明 */}
                    <div className="mt-4">
                        <Card className="bg-light">
                            <Card.Body>
                                <h6 className="text-muted mb-2">权限说明：</h6>
                                <ul className="mb-0 small text-muted">
                                    <li><strong>所有用户</strong>：可以进行入库和出库操作</li>
                                    <li><strong>ADMIN, PMANAGER, INVENTORY</strong>：可以查看库存状态和所有出入库记录</li>
                                    <li><strong>INVENTORY</strong>：可以确认出入库记录，确认后才会更新实际库存</li>
                                </ul>
                            </Card.Body>
                        </Card>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}
