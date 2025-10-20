import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Table, Card, Form, Button, Alert, Modal, Spinner, Badge } from 'react-bootstrap';
import { useSelector } from 'react-redux';
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
    const isAdmin = currentUser?.role === 'ADMIN';

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
            setError(err.response?.data?.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await authService.getAllUsers();
            setUsers(response.data as User[]);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
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
                <h2>Tasks for Order: {orderNumber}</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={() => navigate('/EZERP/PM')}>
                        Back to Project Management
                    </Button>
                    {isAdmin && (
                        <Button variant="primary" onClick={handleCreateTask}>
                            Create New Task
                        </Button>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    {tasks.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="mb-0">No tasks found for this order.</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Created</th>
                                    <th>Due Date</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                                                Details
                                            </Button>
                                            {isAdmin && (
                                                <>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => handleEditTask(task)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => handleDeleteTask(task)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </>
                                            )}
                                            {(currentUser._id === task.assignedTo && task.status !== 'completed') && (
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleMarkComplete(task._id)}
                                                >
                                                    Complete
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
                            <h5>Description</h5>
                            <p>{selectedTask.description}</p>

                            <h5>Details</h5>
                            <p><strong>Assigned By:</strong> {getUserName(selectedTask.assignedBy)}</p>
                            <p><strong>Assigned To:</strong> {getUserName(selectedTask.assignedTo)}</p>
                            <p><strong>Post Date:</strong> {new Date(selectedTask.postDate).toLocaleString()}</p>
                            <p><strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleString()}</p>
                            <p><strong>Status:</strong> {getStatusBadge(selectedTask.status)}</p>
                            <p><strong>Priority:</strong> {getPriorityBadge(selectedTask.priority)}</p>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                        Close
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
                            <Form.Label>Title*</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={formData.title || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description*</Form.Label>
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
                            <Form.Label>Assign To*</Form.Label>
                            <Form.Select
                                name="assignedTo"
                                value={formData.assignedTo || ''}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Select User</option>
                                {users.map(user => (
                                    <option key={user._id} value={user.username}>
                                        {user.username} ({user.role})
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Due Date*</Form.Label>
                            <Form.Control
                                type="date"
                                name="dueDate"
                                value={formData.dueDate || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Priority</Form.Label>
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
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={formData.status || 'pending'}
                                    onChange={handleFormChange}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </Form.Select>
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {isEditing ? 'Save Changes' : 'Create Task'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete the task "{selectedTask?.title}"? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 