import { useState, useEffect } from 'react';
import { Table, Button, Form, Alert } from 'react-bootstrap';
import { orderService } from '../services/api';
import type { Order } from '../types';

interface OrderTableProps {
    onOrderClick: (orderNumber: string) => void;
    onCreateOrder: () => void;
    canManageOrders: boolean;
}

export default function OrderTable({ onOrderClick, onCreateOrder, canManageOrders }: OrderTableProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredOrders(orders);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = orders.filter(order =>
                order.orderNumber.toLowerCase().includes(term) ||
                order.customer.companyName.toLowerCase().includes(term) ||
                order.description.toLowerCase().includes(term)
            );
            setFilteredOrders(filtered);
        }
    }, [searchTerm, orders]);

    const fetchOrders = async () => {
        try {
            const response = await orderService.getAll();
            setOrders(response.data as Order[]);
            setFilteredOrders(response.data as Order[]);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    if (error) {
        return (
            <div className="container mt-4">
                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">

                {canManageOrders && (
                    <Button variant="primary" onClick={onCreateOrder}>
                        新建订单
                    </Button>
                )}
            </div>

            <Form.Group className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="搜索订单..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Form.Group>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>订单号</th>
                        <th>客户</th>
                        <th>商品</th>
                        <th>交付日期</th>
                        {/* <th>Description</th> */}
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order._id}>
                            <td>
                                <Button
                                    variant="link"
                                    className="p-0"
                                    onClick={() => onOrderClick(order.orderNumber)}
                                >
                                    {order.orderNumber}
                                </Button>
                            </td>
                            <td>{order.customer.companyName}</td>
                            <td>
                                <ul className="list-unstyled mb-0">
                                    {order.items.map((item: Order['items'][0], index: number) => (
                                        <li key={index}>
                                            {item.itemId} ({item.quantity})
                                        </li>
                                    ))}
                                </ul>
                            </td>
                            <td>{new Date(order.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            {/* <td>{order.description}</td> */}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
} 