import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Row, Col, Card } from 'react-bootstrap';
import { useSelector } from 'react-redux';
// 不依赖公共工具，直接在本页判断角色（兼容中英文）
import { authService } from '../services/api';

export enum UserRole {
    ADMIN = 'ADMIN',
    MKT = 'MKT',
    MACHINING = 'MACHINING',
    QC = 'QC',
    CHEMIST = 'CHEMIST',
    FINANCE = 'FINANCE',
    HR = 'HR',
    GUEST = 'GUEST'
}

interface User {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    dob: string;
}

interface UserFormData {
    username: string;
    password?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    dob: string;
}

export default function HumanResource() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<UserFormData>({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        role: UserRole.GUEST,
        dob: ''
    });

    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const canManageUsers = (() => {
        const roleRaw = (currentUser?.role || '').trim();
        const roleUpper = roleRaw.toUpperCase();
        // 英文代码或中文展示都支持
        if (roleUpper === 'ADMIN' || roleUpper === 'HR') return true;
        if (roleRaw === '管理员' || roleRaw === '人力资源') return true;
        return false;
    })();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        let filtered = users;

        // Apply role filter
        if (selectedRole !== 'ALL') {
            filtered = filtered.filter(user => user.role === selectedRole);
        }

        // Apply search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(user =>
                user.username.toLowerCase().includes(term) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
                user.email.toLowerCase().includes(term) ||
                user.role.toLowerCase().includes(term)
            );
        }

        setFilteredUsers(filtered);
    }, [searchTerm, selectedRole, users]);

    const fetchUsers = async () => {
        try {
            const response = await authService.getAllUsers();
            setUsers(response.data as User[]);
            setFilteredUsers(response.data as User[]);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        }
    };

    const handleShowModal = (user?: User) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                username: user.username,
                password: '',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                dob: user.dob
            });
        } else {
            setSelectedUser(null);
            setFormData({
                username: '',
                password: '',
                firstName: '',
                lastName: '',
                email: '',
                role: UserRole.GUEST,
                dob: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormData({
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            email: '',
            role: UserRole.GUEST,
            dob: ''
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                const { password, dob, ...updateData } = formData;
                await authService.updateUser(selectedUser._id, updateData);
            } else {
                if (!formData.password || !formData.dob) {
                    setError('Password and Date of Birth are required for new users');
                    return;
                }
                await authService.createUser({
                    username: formData.username,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    role: formData.role,
                    dob: formData.dob
                });
            }
            fetchUsers();
            handleCloseModal();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await authService.deleteUser(userId);
                fetchUsers();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    return (
        <div className="h-100">
            <Card className="h-100">
                <Card.Header>
                    <h2 className="mb-0">用户管理</h2>
                </Card.Header>
                <Card.Body className="overflow-auto">
                    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                placeholder="按用户名、姓名、邮箱或角色搜索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '300px' }}
                            />
                            <Form.Select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'ALL')}
                                style={{ width: '200px' }}
                            >
                                <option value="ALL">All Roles</option>
                                <option value={UserRole.ADMIN}>管理员</option>
                                <option value={UserRole.MKT}>营销</option>
                                <option value={UserRole.MACHINING}>机加工</option>
                                <option value={UserRole.QC}>质检</option>
                                <option value={UserRole.CHEMIST}>镀金</option>
                                <option value={UserRole.FINANCE}>财务</option>
                                <option value={UserRole.HR}>人力资源</option>
                                <option value={UserRole.GUEST}>访客</option>
                            </Form.Select>
                        </div>
                        {canManageUsers && (
                            <Button variant="primary" onClick={() => handleShowModal()}>
                                添加新用户
                            </Button>
                        )}
                    </div>

                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>姓名</th>
                                    <th>邮箱</th>
                                    <th>角色</th>
                                    {canManageUsers && <th>操作</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.username}</td>
                                        <td>{`${user.firstName} ${user.lastName}`}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        {canManageUsers && (
                                            <td>
                                                <Button variant="info" size="sm" className="me-2" onClick={() => handleShowModal(user)}>
                                                    编辑
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(user._id)}>
                                                    删除
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedUser ? '编辑用户' : '创建新用户'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>用户名</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        disabled={!!selectedUser}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>密码</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!selectedUser}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>名</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>姓</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>邮箱</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>角色</Form.Label>
                                    <Form.Select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                        required
                                    >
                                        <option value={UserRole.ADMIN}>管理员</option>
                                        <option value={UserRole.MKT}>营销</option>
                                        <option value={UserRole.MACHINING}>机加工</option>
                                        <option value={UserRole.QC}>质检</option>
                                        <option value={UserRole.CHEMIST}>镀金</option>
                                        <option value={UserRole.FINANCE}>财务</option>
                                        <option value={UserRole.HR}>人力资源</option>
                                        <option value={UserRole.GUEST}>访客</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        {!selectedUser && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>出生日期</Form.Label>
                                        <Form.Control
                                            type="date"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" className="me-2" onClick={handleCloseModal}>
                                取消
                            </Button>
                            <Button variant="primary" type="submit">
                                {selectedUser ? '更新' : '创建'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}