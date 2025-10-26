import React, { useState, useEffect } from 'react';
import type { Customer } from '../types';
import { Modal, Button, Form } from 'react-bootstrap';

interface CustomerFormModalProps {
    show: boolean;
    initialCustomer: Customer | null;
    onClose: () => void;
    onSubmit: (payload: {
        companyName: string;
        name: string;
        department: string;
        position: string;
        phone?: string;
        address: string;
    }) => Promise<void>;
}

export default function CustomerFormModal({ show, initialCustomer, onClose, onSubmit }: CustomerFormModalProps) {
    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (initialCustomer) {
            setCompanyName(initialCustomer.companyName || '');
            setName(initialCustomer.name || '');
            setDepartment(initialCustomer.department || '');
            setPosition(initialCustomer.position || '');
            setPhone(initialCustomer.phone || '');
            setAddress(initialCustomer.address || '');
        } else {
            setCompanyName('');
            setName('');
            setDepartment('');
            setPosition('');
            setPhone('');
            setAddress('');
        }
    }, [initialCustomer, show]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await onSubmit({ companyName, name, department, position, phone: phone || undefined, address });
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{initialCustomer ? 'Edit Customer' : 'Create New Customer'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>公司名称</Form.Label>
                        <Form.Control
                            type="text"
                            value={companyName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>联系人名称</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>部门</Form.Label>
                        <Form.Control
                            type="text"
                            value={department}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>职位</Form.Label>
                        <Form.Control
                            type="text"
                            value={position}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>电话</Form.Label>
                        <Form.Control
                            type="text"
                            value={phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>地址（文本）</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={address}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" className="me-2" onClick={onClose}>
                            取消
                        </Button>
                        <Button variant="primary" type="submit">
                            {initialCustomer ? '更新' : '创建'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}


