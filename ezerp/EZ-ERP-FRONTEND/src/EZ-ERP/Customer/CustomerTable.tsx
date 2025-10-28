import type { Customer } from '../types';
import { Button, Table } from 'react-bootstrap';

interface CustomerTableProps {
    customers: Customer[];
    canManage: boolean;
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
    onView: (customer: Customer) => void;
}

export default function CustomerTable({ customers, canManage, onEdit, onDelete, onView }: CustomerTableProps) {
    return (
        <div className="table-responsive">
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>公司名称</th>
                        <th>联系人名称</th>
                        <th>部门</th>
                        <th>职位</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer) => (
                        <tr key={customer._id}>
                            <td>{customer._id?.toString() || '-'}</td>
                            <td>{customer.companyName}</td>
                            <td>{customer.name}</td>
                            <td>{customer.department}</td>
                            <td>{customer.position}</td>
                            <td>
                                <Button
                                    variant="info"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => onView(customer)}
                                >
                                    联系人详情
                                </Button>
                                {canManage && (
                                    <>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => onEdit(customer)}
                                        >
                                            编辑
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onDelete(customer._id)}
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
    );
}


