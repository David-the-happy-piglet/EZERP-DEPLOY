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
            setError(err.response?.data?.message || '获取订单详情失败');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await orderService.delete(order!._id);
            navigate('/EZERP/Orders');
        } catch (err: any) {
            setError(err.response?.data?.message || '删除订单失败');
        }
    };

    const handleEdit = () => {
        navigate(`/EZERP/Orders/${orderNumber}/edit`);
    };

    if (loading) {
        return <div className="container mt-4">加载中...</div>;
    }

    if (!order) {
        return <div className="container mt-4">未找到订单</div>;
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>订单详情</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/EZERP/Orders')}>
                        返回订单列表
                    </Button>
                    {canManageOrders && (
                        <>
                            <Button variant="primary" className="me-2" onClick={handleEdit}>
                                编辑订单
                            </Button>
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                                删除订单
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
                            <h5>订单信息</h5>
                            <p><strong>订单号：</strong> {order.orderNumber}</p>
                            <p><strong>状态：</strong> <Badge bg={order.status === 'DELIVERED' ? 'success' : 'primary'}>{order.status}</Badge></p>
                            <p><strong>付款状态：</strong> <Badge bg={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>{order.paymentStatus}</Badge></p>
                            <p><strong>交付日期：</strong> {new Date(order.dueDate).toLocaleDateString()}</p>
                            <p><strong>描述：</strong> {order.description}</p>
                        </Col>
                        <Col md={6}>
                            <h5>客户信息</h5>
                            <p><strong>公司：</strong> {order.customer.companyName}</p>
                            <p><strong>联系人：</strong> {order.customer.name}</p>
                            <p><strong>邮箱：</strong> {order.customer.email}</p>
                            <p><strong>电话：</strong> {order.customer.phone}</p>
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
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>${item.price.toFixed(2)}</td>
                                            <td>${(item.quantity * item.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="text-end"><strong>总金额：</strong></td>
                                        <td><strong>${order.totalAmount.toFixed(2)}</strong></td>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <h5>收货地址</h5>
                            <p>
                                {order.shippingAddress.street}<br />
                                {order.shippingAddress.city}，{order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                                {order.shippingAddress.country}
                            </p>
                        </Col>
                    </Row>

                    {order.notes && (
                        <Row className="mt-4">
                            <Col>
                                <h5>备注</h5>
                                <p>{order.notes}</p>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    确认删除订单 {order?.orderNumber} 吗？该操作不可撤销。
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        取消
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        删除
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 