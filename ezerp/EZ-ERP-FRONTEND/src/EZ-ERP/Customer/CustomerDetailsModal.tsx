import React from 'react';
import type { Customer } from '../types';
import { Modal, Button } from 'react-bootstrap';

interface CustomerDetailsModalProps {
    show: boolean;
    customer: Customer | null;
    onClose: () => void;
}

export default function CustomerDetailsModal({ show, customer, onClose }: CustomerDetailsModalProps) {
    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>联系人详情</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <h6 className="text-muted">名称</h6>
                    <p>{customer?.name}</p>
                </div>
                <div className="mb-3">
                    <h6 className="text-muted">部门</h6>
                    <p>{customer?.department}</p>
                </div>
                <div className="mb-3">
                    <h6 className="text-muted">职位</h6>
                    <p>{customer?.position}</p>
                </div>
                <div className="mb-3">
                    <h6 className="text-muted">电话</h6>
                    <p>{customer?.phone || '-'}</p>
                </div>
                <div className="mb-3">
                    <h6 className="text-muted">地址</h6>
                    <p>{customer?.address || '-'}</p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    关闭
                </Button>
            </Modal.Footer>
        </Modal>
    );
}


