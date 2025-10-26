import React, { useEffect, useState } from 'react';
import { customerService } from '../services/api';
import type { Customer } from '../types';
import { Form, Alert, Spinner, Card, Button } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { hasAnyRole, Role } from '../utils/roles';
import CustomerTable from './CustomerTable';
import CustomerDetailsModal from './CustomerDetailsModal';
import CustomerFormModal from './CustomerFormModal';

export default function Customer() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageCustomers = hasAnyRole(currentUser, Role.ADMIN, Role.MKT);

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter((customer: Customer) =>
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

    const handleOpenForm = (customer?: Customer) => {
        setSelectedCustomer(customer || null);
        setShowFormModal(true);
    };

    const handleCloseForm = () => {
        setShowFormModal(false);
        setSelectedCustomer(null);
    };

    const handleSubmitForm = async (payload: {
        companyName: string;
        name: string;
        department: string;
        position: string;
        phone?: string;
        address: string;
    }) => {
        try {
            if (selectedCustomer) {
                await customerService.update(selectedCustomer._id, payload);
            } else {
                await customerService.create(payload);
            }
            await fetchCustomers();
            handleCloseForm();
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                            style={{ width: '300px' }}
                        />
                        {canManageCustomers && (
                            <Button variant="primary" onClick={() => handleOpenForm()}>
                                添加新客户
                            </Button>
                        )}
                    </div>

                    <CustomerTable
                        customers={filteredCustomers}
                        canManage={canManageCustomers}
                        onEdit={(c: Customer) => handleOpenForm(c)}
                        onDelete={handleDelete}
                        onView={(c: Customer) => {
                            setSelectedCustomer(c);
                            setShowDetailsModal(true);
                        }}
                    />
                </Card.Body>
            </Card>

            <CustomerDetailsModal
                show={showDetailsModal}
                customer={selectedCustomer}
                onClose={() => setShowDetailsModal(false)}
            />

            <CustomerFormModal
                show={showFormModal}
                initialCustomer={selectedCustomer}
                onClose={handleCloseForm}
                onSubmit={handleSubmitForm}
            />
        </div>
    );
}