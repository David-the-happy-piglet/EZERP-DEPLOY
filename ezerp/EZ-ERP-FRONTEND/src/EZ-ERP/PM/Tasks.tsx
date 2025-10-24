import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Form, Button, Alert, Modal, Spinner, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { hasAnyRole, Role } from '../utils/roles';
import { taskService, authService } from '../services/api';



interface Task {
    _id: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    postDate: string;
    dueDate: string;
    status: 'pending' | 'in progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    orderRelated: boolean;
    orderNumber: string;
}

interface User {
    _id: string;
    username: string;
    role: string;
}

export default function Tasks() {
    const { orderNumber } = useParams<{ orderNumber: string }>();
    const navigate = useNavigate();
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const isAdmin = hasAnyRole(currentUser, Role.ADMIN);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For task details modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // For create/edit modal
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending',
        orderRelated: true,
        orderNumber: orderNumber
    });

    // For delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, [orderNumber]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await taskService.getByOrderNumber(orderNumber!);
            setTasks(response.data as Task[]);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.message || '加载任务失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await authService.getAllUsers();
            setUsers(response.data as User[]);
        } catch (err: any) {
            console.error('加载用户失败:', err);
        }
    };

    const handleCreateTask = () => {
        setFormData({
            title: '',
            description: '',
            assignedTo: '',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'medium',
            status: 'pending',
            orderRelated: true,
            orderNumber: orderNumber
        });
        setIsEditing(false);
        setShowTaskModal(true);
    };

    const handleEditTask = (task: Task) => {
        setFormData({
            ...task,
            dueDate: new Date(task.dueDate).toISOString().split('T')[0]
        });
        setIsEditing(true);
        setShowTaskModal(true);
    };

    const handleViewDetails = (task: Task) => {
        setSelectedTask(task);
        setShowDetailsModal(true);
    };

    const handleDeleteTask = (task: Task) => {
        setSelectedTask(task);
        setShowDeleteModal(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        try {
            if (!formData.title || !formData.description || !formData.assignedTo || !formData.dueDate) {
                setError('Please fill in all required fields');
                return;
            }

            // First, check that we have current user info
            if (!currentUser || !currentUser.username) {
                setError('User information is not available. Please log in again.');
                return;
            }

            const payload = {
                title: formData.title,
                description: formData.description,
                assignedTo: formData.assignedTo,
                assignedBy: currentUser.username,
                dueDate: formData.dueDate,
                status: formData.status as 'pending' | 'in progress' | 'completed',
                priority: formData.priority as 'low' | 'medium' | 'high',
                orderRelated: true,
                orderNumber: orderNumber
            };

            console.log('Creating task with payload:', payload);

            if (isEditing && formData._id) {
                await taskService.update(formData._id, payload);
            } else {
                await taskService.create(payload);
            }

            setShowTaskModal(false);
            fetchTasks();
            setError(null);
        } catch (err: any) {
            console.error('Task creation error:', err);
            setError(err.response?.data?.message || 'Failed to save task');
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTask) return;

        try {
            await taskService.delete(selectedTask._id);
            setShowDeleteModal(false);
            fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete task');
        }
    };

    const handleMarkComplete = async (taskId: string) => {
        try {
            await taskService.markAsCompleted(taskId);
            fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to mark task as completed');
        }
    };

    const getUserName = (userId: string) => {
        const user = users.find(u => u._id === userId);
        return user ? user.username : userId;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge bg="warning">Pending</Badge>;
            case 'in progress':
                return <Badge bg="primary">In Progress</Badge>;
            case 'completed':
                return <Badge bg="success">Completed</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'low':
                return <Badge bg="info">Low</Badge>;
            case 'medium':
                return <Badge bg="warning">Medium</Badge>;
            case 'high':
                return <Badge bg="danger">High</Badge>;
            default:
                return <Badge bg="secondary">{priority}</Badge>;
        }
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>订单 {orderNumber} 的任务</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/EZERP/PM')}>
                        返回项目管理
                    </Button>
                    {isAdmin && (
                        <Button variant="primary" onClick={handleCreateTask}>
                            创建新任务
                        </Button>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    {tasks.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="mb-0">没有找到此订单的任务。</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>标题</th>
                                    <th>来自</th>
                                    <th>指派给</th>
                                    <th>创建时间</th>
                                    <th>截止日期</th>
                                    <th>优先级</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task._id}>
                                        <td>{task.title}</td>
                                        <td>{getUserName(task.assignedBy)}</td>
                                        <td>{getUserName(task.assignedTo)}</td>
                                        <td>{new Date(task.postDate).toLocaleDateString()}</td>
                                        <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                        <td>{getPriorityBadge(task.priority)}</td>
                                        <td>{getStatusBadge(task.status)}</td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleViewDetails(task)}
                                            >
                                                查看详情
                                            </Button>
                                            {isAdmin && (
                                                <>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => handleEditTask(task)}
                                                    >
                                                        编辑
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => handleDeleteTask(task)}
                                                    >
                                                        删除
                                                    </Button>
                                                </>
                                            )}
                                            {(currentUser._id === task.assignedTo && task.status !== 'completed') && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleMarkComplete(task._id)}
                                                >
                                                    完成
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Task Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedTask?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTask && (
                        <>
                            <h5>描述</h5>
                            <p>{selectedTask.description}</p>

                            <h5>详情</h5>
                            <p><strong>来自:</strong> {getUserName(selectedTask.assignedBy)}</p>
                            <p><strong>指派给:</strong> {getUserName(selectedTask.assignedTo)}</p>
                            <p><strong>创建时间:</strong> {new Date(selectedTask.postDate).toLocaleString()}</p>
                            <p><strong>截止日期:</strong> {new Date(selectedTask.dueDate).toLocaleString()}</p>
                            <p><strong>状态:</strong> {getStatusBadge(selectedTask.status)}</p>
                            <p><strong>优先级:</strong> {getPriorityBadge(selectedTask.priority)}</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        关闭
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create/Edit Task Modal */}
            <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Task' : 'Create New Task'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>标题*</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>描述*</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>指派给*</Form.Label>
                            <Form.Select
                                name="assignedTo"
                                value={formData.assignedTo || ''}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">选择用户</option>
                                {users.map(user => (
                                    <option key={user._id} value={user.username}>
                                        {user.username} ({user.role})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>截止日期*</Form.Label>
                            <Form.Control
                                type="date"
                                name="dueDate"
                                value={formData.dueDate || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>优先级</Form.Label>
                            <Form.Select
                                name="priority"
                                value={formData.priority || 'medium'}
                                onChange={handleFormChange}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Form.Select>
                        </Form.Group>

                        {isEditing && (
                            <Form.Group className="mb-3">
                                <Form.Label>状态</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={formData.status || 'pending'}
                                    onChange={handleFormChange}
                                >
                                    <option value="pending">待办</option>
                                    <option value="in progress">进行中</option>
                                    <option value="completed">完成</option>
                                </Form.Select>
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
                        取消
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {isEditing ? '保存更改' : '创建任务'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    确定要删除任务 "{selectedTask?.title}"? 此操作无法撤销。
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        取消
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        删除
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 