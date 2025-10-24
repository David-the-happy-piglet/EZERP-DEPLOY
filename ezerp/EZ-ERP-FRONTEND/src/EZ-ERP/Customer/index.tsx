import { useEffect, useState } from 'react';
import { customerService } from '../services/api';
import type { Customer, Address } from '../types';
import { Button, Table, Modal, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';

export default function Customer() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
        } as Address
    });

    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageCustomers = currentUser?.role === 'ADMIN' || currentUser?.role === 'MKT';

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer =>
                customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCustomers(filtered);
        }
    }, [searchTerm, customers]);

    const fetchCustomers = async () => {
        try {
            const response = await customerService.getAll();
            if (Array.isArray(response.data)) {
                setCustomers(response.data as Customer[]);
                setFilteredCustomers(response.data as Customer[]);
            } else {
                throw new Error('无效的响应格式');
            }
            setError(null);
        } catch (err) {
            setError('获取客户失败');
            console.error('获取客户失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (customer?: Customer) => {
        if (customer) {
            setSelectedCustomer(customer);
            setFormData({
                companyName: customer.companyName,
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: ''
                }
            });
        } else {
            setSelectedCustomer(null);
            setFormData({
                companyName: '',
                name: '',
                email: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: ''
                }
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCustomer(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedCustomer) {
                await customerService.update(selectedCustomer._id, formData);
            } else {
                await customerService.create(formData);
            }
            fetchCustomers();
            handleCloseModal();
        } catch (err) {
            setError('Failed to save customer');
            console.error('Error saving customer:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await customerService.delete(id);
                fetchCustomers();
            } catch (err) {
                setError('Failed to delete customer');
                console.error('Error deleting customer:', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-100 d-flex justify-content-center align-items-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">加载客户...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="h-100">
            <Card className="h-100">
                <Card.Header>
                    <h2 className="mb-0">客户</h2>
                </Card.Header>
                <Card.Body className="overflow-auto">
                    {error && <Alert variant="danger">{error}</Alert>}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <Form.Control
                            type="text"
                            placeholder="按公司名称或联系人名称搜索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '300px' }}
                        />
                        {canManageCustomers && (
                            <Button variant="primary" onClick={() => handleShowModal()}>
                                添加新客户
                            </Button>
                        )}
                    </div>

                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>公司名称</th>
                                    <th>联系人名称</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>{customer._id?.toString() || '-'}</td>
                                        <td>{customer.companyName}</td>
                                        <td>{customer.name}</td>
                                        <td>
                                            <Button
                                                variant="info"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setShowContactModal(true);
                                                }}
                                            >
                                                联系人详情
                                            </Button>
                                            {canManageCustomers && (
                                                <>
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleShowModal(customer)}
                                                    >
                                                        编辑
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(customer._id)}
                                                    >
                                                        删除
                                                    </Button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Contact Details Modal */}
            <Modal show={showContactModal} onHide={() => setShowContactModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>联系人详情</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <h6 className="text-muted">名称</h6>
                        <p>{selectedCustomer?.name}</p>
                    </div>
                    <div className="mb-3">
                        <h6 className="text-muted">电话</h6>
                        <p>{selectedCustomer?.phone || '-'}</p>
                    </div>
                    <div className="mb-3">
                        <h6 className="text-muted">邮箱</h6>
                        <p>{selectedCustomer?.email || '-'}</p>
                    </div>
                    {selectedCustomer?.address && (
                        <div className="mb-3">
                            <h6 className="text-muted">地址</h6>
                            <div className="pl-3">
                                {selectedCustomer.address.street && <p>{selectedCustomer.address.street}</p>}
                                {selectedCustomer.address.city && <p>{selectedCustomer.address.city}</p>}
                                {selectedCustomer.address.state && <p>{selectedCustomer.address.state}</p>}
                                {selectedCustomer.address.country && <p>{selectedCustomer.address.country}</p>}
                                {selectedCustomer.address.zipCode && <p>{selectedCustomer.address.zipCode}</p>}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContactModal(false)}>
                        关闭
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedCustomer ? 'Edit Customer' : 'Create New Customer'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>公司名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>联系人名称</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>邮箱</Form.Label>
                            <Form.Control
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>电话</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </Form.Group>
                        <h5 className="mt-4">地址</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>街道</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address.street}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    address: { ...formData.address, street: e.target.value }
                                })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>城市</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address.city}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    address: { ...formData.address, city: e.target.value }
                                })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>省</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address.state}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    address: { ...formData.address, state: e.target.value }
                                })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>国家</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address.country}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    address: { ...formData.address, country: e.target.value }
                                })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>邮编</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.address.zipCode}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    address: { ...formData.address, zipCode: e.target.value }
                                })}
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
                                取消
                            </Button>
                            <Button variant="primary" type="submit">
                                {selectedCustomer ? '更新' : '创建'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}