import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Form, Modal, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { taskService, messageService } from '../services/api';

// Generate a random ID for messages
/* const generateMessageId = () => {
    return `MSG-${Math.random().toString(36).substring(2, 10)}`;
}; */

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

// Update the Message interface to match the API service
interface Message {
    _id?: string;
    messageType: 'new order' | 'order status change' | 'order update' | 'others';
    messageTitle: string;
    messageContent: string;
    postedBy: string;
    orderRelated?: boolean;
    orderNumber?: string;
    postDate?: Date | string;
    read?: boolean;
}

type SortField = 'dueDate' | 'priority' | null;
type SortDirection = 'asc' | 'desc';

export default function Overview() {
    const navigate = useNavigate();
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For sorting
    const [sortField, setSortField] = useState<SortField>('dueDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // For task start modal
    const [showStartModal, setShowStartModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [messageContent, setMessageContent] = useState('');

    // Add state for messages
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(true);
    const [messagesError, setMessagesError] = useState<string | null>(null);

    // Add state for completion modal
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [completionMessage, setCompletionMessage] = useState('');

    useEffect(() => {
        fetchUserTasks();
        fetchMessages();
    }, []);

    useEffect(() => {
        if (tasks.length > 0) {
            sortTasks();
        }
    }, [sortField, sortDirection]);

    const fetchUserTasks = async () => {
        if (!currentUser || !currentUser.username) {
            setError('User information not available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch tasks assigned to the current user
            const response = await taskService.getByAssignee(currentUser.username);
            // Filter for only pending and in progress tasks
            const activeTasks = (response.data as Task[]).filter(
                task => task.status === 'pending' || task.status === 'in progress'
            );
            setTasks(activeTasks);
            sortTasks(activeTasks);
            setLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch tasks:', err);
            setError('Failed to load your tasks');
            setLoading(false);
        }
    };

    const sortTasks = (tasksToSort = tasks) => {
        if (!sortField) return;

        const sorted = [...tasksToSort].sort((a, b) => {
            if (sortField === 'dueDate') {
                const dateA = new Date(a.dueDate).getTime();
                const dateB = new Date(b.dueDate).getTime();
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortField === 'priority') {
                const priorityMap = { low: 1, medium: 2, high: 3 };
                const priorityA = priorityMap[a.priority] || 0;
                const priorityB = priorityMap[b.priority] || 0;
                return sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
            }
            return 0;
        });

        setTasks(sorted);
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

    const handleViewTaskDetails = (task: Task) => {
        if (task.orderRelated && task.orderNumber) {
            navigate(`/EZERP/PM/${task.orderNumber}/Tasks`);
        } else {
            // For now, just navigate to PM page for non-order tasks
            navigate('/EZERP/PM');
        }
    };

    const handleStartTask = (task: Task) => {
        setSelectedTask(task);
        setMessageContent('');
        setShowStartModal(true);
    };

    const handleSubmitStart = async () => {
        if (!selectedTask || !currentUser || !currentUser.username) return;

        try {
            // 1. Update task status to "in progress"
            await taskService.update(selectedTask._id, {
                ...selectedTask,
                status: 'in progress'
            });

            // 2. Create a new message
            const messagePayload: Message = {
                messageType: 'others', // Use 'others' since 'task started' is not in the API type
                messageTitle: `${currentUser.username} has started ${selectedTask.title}`,
                messageContent: messageContent || 'Task has been started.',
                postedBy: currentUser.username,
                orderRelated: selectedTask.orderRelated,
                orderNumber: selectedTask.orderNumber
            };

            await messageService.create(messagePayload);

            // 3. Close modal and refresh tasks
            setShowStartModal(false);
            fetchUserTasks();
        } catch (err: any) {
            console.error('Failed to start task:', err);
            setError('Failed to start the task. Please try again.');
        }
    };

    const handleMarkComplete = (task: Task) => {
        setSelectedTask(task);
        setCompletionMessage('');
        setShowCompleteModal(true);
    };

    const handleSubmitCompletion = async () => {
        if (!selectedTask || !currentUser || !currentUser.username) return;

        try {
            // 1. Update task status to "completed"
            await taskService.markAsCompleted(selectedTask._id);

            // 2. Create a new message
            const messagePayload: Message = {
                messageType: 'others', // Using 'others' since API might not have 'task completed'
                messageTitle: `${currentUser.username} has completed ${selectedTask.title}`,
                messageContent: completionMessage || 'Task has been completed.',
                postedBy: currentUser.username,
                orderRelated: selectedTask.orderRelated,
                orderNumber: selectedTask.orderNumber
            };

            await messageService.create(messagePayload);

            // 3. Close modal and refresh tasks
            setShowCompleteModal(false);
            fetchUserTasks();
            // Also refresh messages to show the new one
            fetchMessages();
        } catch (err: any) {
            console.error('Failed to complete task:', err);
            setError('Failed to complete the task. Please try again.');
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

    const renderTaskTable = () => {
        if (loading) {
            return (
                <div className="text-center my-4">
                    <Spinner animation="border" />
                </div>
            );
        }

        if (error) {
            return <div className="alert alert-danger">{error}</div>;
        }

        // Only show pending and in-progress tasks
        const activeTasks = tasks.filter(task =>
            task.status === 'pending' || task.status === 'in progress'
        );

        if (activeTasks.length === 0) {
            return <div className="alert alert-info">You have no pending tasks.</div>;
        }

        return (
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>From</th>
                        <th>Status</th>
                        <th
                            onClick={() => handleSort('priority')}
                            style={{ cursor: 'pointer' }}
                        >
                            Priority{getSortIcon('priority')}
                        </th>
                        <th
                            onClick={() => handleSort('dueDate')}
                            style={{ cursor: 'pointer' }}
                        >
                            Due Date{getSortIcon('dueDate')}
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {activeTasks.map(task => (
                        <tr key={task._id}>
                            <td>
                                {task.title}
                                {task.orderRelated && task.orderNumber && (
                                    <div>
                                        <Badge bg="secondary" className="mt-1">
                                            Order: {task.orderNumber}
                                        </Badge>
                                    </div>
                                )}
                            </td>
                            <td>{task.assignedBy}</td>
                            <td>{getStatusBadge(task.status)}</td>
                            <td>{getPriorityBadge(task.priority)}</td>
                            <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-1"
                                    onClick={() => handleViewTaskDetails(task)}
                                >
                                    Details
                                </Button>
                                {task.status === 'pending' ? (
                                    <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => handleStartTask(task)}
                                    >
                                        Start
                                    </Button>
                                ) : task.status === 'in progress' ? (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        onClick={() => handleMarkComplete(task)}
                                    >
                                        Complete
                                    </Button>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    // Add function to fetch messages
    const fetchMessages = async () => {
        try {
            setMessagesLoading(true);
            const response = await messageService.getAll();
            // Sort messages by postDate in descending order (newest first)
            const sortedMessages = (response.data as Message[]).sort((a, b) => {
                return new Date(b.postDate || new Date()).getTime() -
                    new Date(a.postDate || new Date()).getTime();
            });
            setMessages(sortedMessages.slice(0, 10)); // Get the 10 most recent messages
            setMessagesLoading(false);
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
            setMessagesError('Failed to load messages');
            setMessagesLoading(false);
        }
    };

    // Add a function to format the date
    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Update the getMessageTypeBadge function to handle task-related messages
    const getMessageTypeBadge = (type: string) => {
        switch (type) {
            case 'new order':
                return <Badge bg="success">New Order</Badge>;
            case 'order status change':
                return <Badge bg="info">Status Change</Badge>;
            case 'order update':
                return <Badge bg="warning">Update</Badge>;
            case 'task started':
            case 'task completed':
                return <Badge bg="primary">Tasks</Badge>;
            case 'others':
                return <Badge bg="secondary">Info</Badge>;
            default:
                return <Badge bg="secondary">{type}</Badge>;
        }
    };

    // Add render function for messages
    const renderMessages = () => {
        if (messagesLoading) {
            return (
                <div className="text-center my-4">
                    <Spinner animation="border" />
                </div>
            );
        }

        if (messagesError) {
            return <div className="alert alert-danger">{messagesError}</div>;
        }

        if (messages.length === 0) {
            return <div className="alert alert-info">No messages found.</div>;
        }

        return (
            <ListGroup>
                {messages.map((message) => (
                    <ListGroup.Item
                        key={message._id}
                        className={message.read ? '' : 'fw-bold'}
                        action
                    >
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <div className="mb-1">
                                    {getMessageTypeBadge(message.messageType)}{' '}
                                    <span className="ms-2">{message.messageTitle}</span>
                                </div>
                                <p className="text-muted mb-1 small">
                                    From: {message.postedBy} · {formatDate(message.postDate)}
                                </p>
                                <p className="mb-0">{message.messageContent}</p>
                            </div>
                            {message.orderRelated && message.orderNumber && (
                                <Badge
                                    bg="secondary"
                                    pill
                                    className="mt-1"
                                >
                                    Order: {message.orderNumber}
                                </Badge>
                            )}
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        );
    };

    return (
        <div className="container mt-4">


            <Card className="mt-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h3>My Tasks</h3>
                    <div>
                        <Form.Select
                            size="sm"
                            value={`${sortField}-${sortDirection}`}
                            onChange={(e) => {
                                const [field, direction] = e.target.value.split('-');
                                setSortField(field as SortField);
                                setSortDirection(direction as SortDirection);
                            }}
                            style={{ width: 'auto', display: 'inline-block' }}
                            className="me-2"
                        >
                            <option value="dueDate-asc">Due Date (earliest first)</option>
                            <option value="dueDate-desc">Due Date (latest first)</option>
                            <option value="priority-desc">Priority (highest first)</option>
                            <option value="priority-asc">Priority (lowest first)</option>
                        </Form.Select>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={fetchUserTasks}
                        >
                            Refresh
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {renderTaskTable()}
                </Card.Body>
            </Card>

            <div className="mt-4">
                <Card>
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h3>Recent Messages</h3>
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={fetchMessages}
                        >
                            Refresh
                        </Button>
                    </Card.Header>
                    <Card.Body>
                        {renderMessages()}
                    </Card.Body>
                </Card>
            </div>

            {/* Task Start Modal */}
            <Modal show={showStartModal} onHide={() => setShowStartModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Start Task: {selectedTask?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Add a message about starting this task..."
                                value={messageContent}
                                onChange={(e) => setMessageContent(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Your message will be visible to others in the system.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStartModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmitStart}>
                        Start Task
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Completion Modal */}
            <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Complete Task: {selectedTask?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Completion Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Add a message about completing this task..."
                                value={completionMessage}
                                onChange={(e) => setCompletionMessage(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Your message will be visible to others in the system.
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleSubmitCompletion}>
                        Mark as Completed
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}