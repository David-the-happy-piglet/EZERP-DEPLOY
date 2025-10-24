import { useState, useEffect } from 'react';
import { Table, Card, Form, Button, Alert, Badge, Modal, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { orderService, taskService, authService } from '../services/api';
import { useSelector } from 'react-redux';
import { hasAnyRole, Role } from '../utils/roles';
import type { Order } from '../types';
/* import axios from 'axios'; */

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
    orderNumber?: string;
}

interface User {
    _id: string;
    username: string;
    role: string;
}

type SortField = 'postDate' | 'dueDate' | null;
type SortDirection = 'asc' | 'desc';

export default function ProjectManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [taskLoading, setTaskLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taskError, setTaskError] = useState<string | null>(null);
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const isAdmin = hasAnyRole(currentUser, Role.ADMIN);
    const navigate = useNavigate();

    // For task details modal
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // For create task modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'medium',
        status: 'pending',
        orderRelated: false
    });

    // For task filters
    const [fromFilter, setFromFilter] = useState<string>('');
    const [toFilter, setToFilter] = useState<string>('');
    const [priorityFilter, setPriorityFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // For sorting
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // For user data
    const [users, setUsers] = useState<User[]>([]);

    // Add state for delete confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    // Add isEditing state
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchTasks();
        fetchUsers();
    }, []);

    // Apply filters whenever tasks or filter values change
    useEffect(() => {
        applyFilters();
    }, [tasks, fromFilter, toFilter, priorityFilter, statusFilter, sortField, sortDirection]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getAll();
            const allOrders = response.data as Order[];
            // Filter to only include active orders
            const activeOrders = allOrders.filter(order =>
                ['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status)
            );
            setOrders(activeOrders);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch orders');
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            setTaskLoading(true);
            const response = await taskService.getAll();
            const allTasks = response.data as Task[];
            // Filter to only include active tasks
            const activeTasks = allTasks.filter(task =>
                ['pending', 'in progress'].includes(task.status)
            );
            setTasks(activeTasks);
            setFilteredTasks(activeTasks);
            setTaskLoading(false);
        } catch (err: any) {
            setTaskError(err.response?.data?.message || 'Failed to fetch tasks');
            setTaskLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            setTaskLoading(true);
            const response = await authService.getAllUsers();
            if (response && response.data) {
                setUsers(response.data as User[]);
            }
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            // Fallback to empty array instead of showing an error
            setUsers([]);
        } finally {
            setTaskLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...tasks];

        if (fromFilter) {
            result = result.filter(task => task.assignedBy === fromFilter);
        }

        if (toFilter) {
            result = result.filter(task => task.assignedTo === toFilter);
        }

        if (priorityFilter) {
            result = result.filter(task => task.priority === priorityFilter);
        }

        if (statusFilter) {
            result = result.filter(task => task.status === statusFilter);
        }

        // Apply sorting if a sort field is selected
        if (sortField) {
            result = sortTasks(result, sortField, sortDirection);
        }

        setFilteredTasks(result);
    };

    const handleCreateTask = () => {
        setFormData({
            title: '',
            description: '',
            assignedTo: '',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'medium',
            status: 'pending',
            orderRelated: false
        });
        setIsEditing(false);
        setShowCreateModal(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmitTask = async () => {
        try {
            if (!formData.title || !formData.description || !formData.assignedTo || !formData.dueDate) {
                setTaskError('Please fill in all required fields');
                return;
            }

            // Check that we have current user info
            if (!currentUser || !currentUser.username) {
                setTaskError('User information is not available. Please log in again.');
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
                orderRelated: formData.orderRelated || false
            };

            if (isEditing && formData._id) {
                // Update existing task
                await taskService.update(formData._id, payload);
            } else {
                // Create new task
                await taskService.create(payload);
            }

            setShowCreateModal(false);
            fetchTasks();
            setTaskError(null);
        } catch (err: any) {
            console.error('Task operation error:', err);
            setTaskError(err.response?.data?.message || 'Failed to save task');
        }
    };

    const sortTasks = (tasksToSort: Task[], field: SortField, direction: SortDirection) => {
        return [...tasksToSort].sort((a, b) => {
            if (!field) return 0;

            const dateA = new Date(a[field]);
            const dateB = new Date(b[field]);

            if (direction === 'asc') {
                return dateA.getTime() - dateB.getTime();
            } else {
                return dateB.getTime() - dateA.getTime();
            }
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            // Toggle direction if clicking the same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // New field, set to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;

        return sortDirection === 'asc'
            ? ' ↑' // Ascending arrow
            : ' ↓'; // Descending arrow
    };

    const clearFilters = () => {
        setFromFilter('');
        setToFilter('');
        setPriorityFilter('');
        setStatusFilter('');
        setSortField(null);
    };

    // Extract unique assigners and assignees for filter dropdowns
    const getUniqueAssigners = () => {
        return [...new Set(tasks.map(task => task.assignedBy))];
    };

    const getUniqueAssignees = () => {
        return [...new Set(tasks.map(task => task.assignedTo))];
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await orderService.update(orderId, { status: newStatus as Order['status'] });
            // Update the local state
            setOrders(orders.map(order =>
                order._id === orderId
                    ? { ...order, status: newStatus as Order['status'] }
                    : order
            ));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update order status');
        }
    };

    const handleOrderClick = (orderNumber: string) => {
        navigate(`/EZERP/Orders/${orderNumber}`);
    };

    const handleTasksClick = (orderNumber: string) => {
        navigate(`/EZERP/PM/${orderNumber}/Tasks`);
    };

    const handleViewTaskDetails = (taskId: string) => {
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        if (task.orderRelated && task.orderNumber) {
            // For order-related tasks, navigate to the order tasks page
            navigate(`/EZERP/PM/${task.orderNumber}/Tasks`);
        } else {
            // For non-order related tasks, show task details in a modal
            setSelectedTask(task);
            setShowTaskModal(true);
        }
    };

    /* const handleMarkTaskComplete = async (taskId: string) => {
        try {
            await taskService.markAsCompleted(taskId);
            // Update local state after successful completion
            setTasks(tasks.filter(task => task._id !== taskId));
        } catch (err: any) {
            setTaskError(err.response?.data?.message || 'Failed to mark task as completed');
        }
    };ß
 */
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge bg="warning">Pending</Badge>;
            case 'in progress':
                return <Badge bg="primary">In Progress</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'low':
                return <Badge bg="info">低</Badge>;
            case 'medium':
                return <Badge bg="warning">中</Badge>;
            case 'high':
                return <Badge bg="danger">高</Badge>;
            default:
                return <Badge bg="secondary">{priority}</Badge>;
        }
    };

    // Add these functions for editing and deleting tasks
    const handleEditTask = (task: Task) => {
        setFormData({
            ...task,
            dueDate: new Date(task.dueDate).toISOString().split('T')[0]
        });
        setIsEditing(true);
        setShowCreateModal(true);
    };

    const handleDeleteTaskPrompt = (task: Task) => {
        setTaskToDelete(task);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;

        try {
            await taskService.delete(taskToDelete._id);
            fetchTasks(); // Refresh the task list
            setShowDeleteConfirm(false);
        } catch (err: any) {
            console.error('Failed to delete task:', err);
            setTaskError(err.response?.data?.message || 'Failed to delete task');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mt-4">

            {error && <Alert variant="danger">{error}</Alert>}

            <Card className="mt-4">
                <Card.Header>
                    <h3>进行中的订单</h3>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>订单号</th>
                                <th>截止日期</th>
                                <th>状态</th>
                                <th>客户</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center">没有进行中的订单</td>
                                </tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id}>
                                        <td>{order.orderNumber}</td>
                                        <td>{new Date(order.dueDate).toLocaleDateString()}</td>
                                        <td>
                                            {isAdmin ? (
                                                <Form.Select
                                                    value={order.status}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                >
                                                    <option value="PENDING">待处理</option>
                                                    <option value="PROCESSING">处理中</option>
                                                    <option value="SHIPPED">已发货</option>
                                                    <option value="DELIVERED">已交付</option>
                                                    <option value="CANCELLED">已取消</option>
                                                </Form.Select>
                                            ) : (
                                                order.status
                                            )}
                                        </td>
                                        <td>{order.customer.companyName}</td>
                                        <td>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleOrderClick(order.orderNumber)}
                                            >
                                                查看详情
                                            </Button>
                                            <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => handleTasksClick(order.orderNumber)}
                                            >
                                                任务
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Active Tasks Table */}
            <Card className="mt-4">
                <Card.Header>
                    <h3>进行中的任务</h3>
                </Card.Header>
                <Card.Body>
                    {taskError && <Alert variant="danger">{taskError}</Alert>}

                    {/* Task Filters */}
                    <Row className="mb-3">
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>来自</Form.Label>
                                <Form.Select
                                    value={fromFilter}
                                    onChange={(e) => setFromFilter(e.target.value)}
                                >
                                    <option value="">全部</option>
                                    {getUniqueAssigners().map(assigner => (
                                        <option key={assigner} value={assigner}>{assigner}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>指派给</Form.Label>
                                <Form.Select
                                    value={toFilter}
                                    onChange={(e) => setToFilter(e.target.value)}
                                >
                                    <option value="">全部</option>
                                    {getUniqueAssignees().map(assignee => (
                                        <option key={assignee} value={assignee}>{assignee}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>优先级</Form.Label>
                                <Form.Select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                >
                                    <option value="">全部</option>
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>状态</Form.Label>
                                <Form.Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">全部</option>
                                    <option value="pending">待办</option>
                                    <option value="in progress">进行中</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4} className="d-flex align-items-end">
                            <Button
                                variant="outline-secondary"
                                onClick={clearFilters}
                                className="me-2"
                            >
                                清空筛选
                            </Button>
                            {isAdmin && (
                                <Button
                                    variant="primary"
                                    onClick={handleCreateTask}
                                >
                                    创建任务
                                </Button>
                            )}
                        </Col>
                    </Row>

                    {taskLoading ? (
                        <div className="text-center">加载任务...</div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>OS</th>
                                    <th>标题</th>
                                    <th>来自</th>
                                    <th>指派给</th>
                                    <th
                                        onClick={() => handleSort('postDate')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        创建时间{getSortIcon('postDate')}
                                    </th>
                                    <th
                                        onClick={() => handleSort('dueDate')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        截止日期{getSortIcon('dueDate')}
                                    </th>
                                    <th>优先级</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center">No active tasks found</td>
                                    </tr>
                                ) : (
                                    filteredTasks.map(task => (
                                        <tr key={task._id}>
                                            <td className="text-center">
                                                {task.orderRelated && (
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#28a745',
                                                        margin: '0 auto'
                                                    }}></div>
                                                )}
                                            </td>
                                            <td>
                                                {task.title}
                                            </td>
                                            <td>{task.assignedBy}</td>
                                            <td>{task.assignedTo}</td>
                                            <td>{new Date(task.postDate).toLocaleDateString()}</td>
                                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                                            <td>{getPriorityBadge(task.priority)}</td>
                                            <td>{getStatusBadge(task.status)}</td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-1"
                                                    onClick={() => handleViewTaskDetails(task._id)}
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
                                                            onClick={() => handleDeleteTaskPrompt(task)}
                                                        >
                                                            删除
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Task Details Modal */}
            <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedTask?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTask && (
                        <>
                            <h5>描述</h5>
                            <p>{selectedTask.description}</p>

                            <h5>详情</h5>
                            <p><strong>来自:</strong> {selectedTask.assignedBy}</p>
                            <p><strong>指派给:</strong> {selectedTask.assignedTo}</p>
                            <p><strong>创建时间:</strong> {new Date(selectedTask.postDate).toLocaleString()}</p>
                            <p><strong>截止日期:</strong> {new Date(selectedTask.dueDate).toLocaleString()}</p>
                            <p><strong>状态:</strong> {getStatusBadge(selectedTask.status)}</p>
                            <p><strong>优先级:</strong> {getPriorityBadge(selectedTask.priority)}</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
                        关闭
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create Task Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? '编辑任务' : '创建新任务'}</Modal.Title>
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
                                {users && users.length > 0 ? (
                                    users.map(user => (
                                        <option key={user._id} value={user.username}>
                                            {user.username} ({user.role})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>加载用户...</option>
                                )}
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
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>状态</Form.Label>
                            <Form.Select
                                name="status"
                                value={formData.status || 'pending'}
                                onChange={handleFormChange}
                            >
                                <option value="pending">待办</option>
                                <option value="in progress">进行中</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                        取消
                    </Button>
                    <Button variant="primary" onClick={handleSubmitTask}>
                        {isEditing ? '保存更改' : '创建任务'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>确认删除</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    确定要删除任务 "{taskToDelete?.title}"?
                    <p className="text-danger mt-2">此操作无法撤销。</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
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