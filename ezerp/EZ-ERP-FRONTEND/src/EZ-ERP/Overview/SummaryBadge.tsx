import { useState, useEffect } from 'react';
import { Card, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { taskService } from '../services/api';

interface TaskSummary {
    completedOrders: number;
    inProgressOrders: number;
    totalOrders: number;
    completionRate: number;
}

interface SummaryBadgeProps {
    className?: string;
}

export default function SummaryBadge({ className = '' }: SummaryBadgeProps) {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const [summary, setSummary] = useState<TaskSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if user has permission to view this component
    const canView = currentUser && ['ADMIN', 'PMANAGER', 'MKT'].includes(currentUser.role);

    useEffect(() => {
        if (canView) {
            fetchAnnualTaskSummary();
        }
    }, [canView]);

    const fetchAnnualTaskSummary = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current year
            const currentYear = new Date().getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

            // Fetch all tasks
            const response = await taskService.getAll();
            const allTasks = (response.data as any[]) || [];

            // Filter tasks for current year and order-related tasks
            const yearTasks = allTasks.filter((task: any) => {
                const taskDate = new Date(task.postDate);
                return taskDate >= startOfYear && taskDate <= endOfYear && task.orderRelated;
            });

            // Calculate summary
            const completedOrders = yearTasks.filter((task: any) => task.status === 'completed').length;
            const inProgressOrders = yearTasks.filter((task: any) => task.status === 'in progress').length;
            const totalOrders = yearTasks.length;
            const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

            setSummary({
                completedOrders,
                inProgressOrders,
                totalOrders,
                completionRate
            });
        } catch (err: any) {
            console.error('Failed to fetch annual task summary:', err);
            setError('加载年度任务进度失败');
        } finally {
            setLoading(false);
        }
    };

    // Don't render if user doesn't have permission
    if (!canView) {
        return null;
    }

    if (loading) {
        return (
            <Card className={`mt-4 ${className}`}>
                <Card.Header>
                    <h4>年度任务进度</h4>
                </Card.Header>
                <Card.Body className="text-center">
                    <Spinner animation="border" />
                    <p className="mt-2 text-muted">加载中...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={`mt-4 ${className}`}>
                <Card.Header>
                    <h4>年度任务进度</h4>
                </Card.Header>
                <Card.Body>
                    <div className="alert alert-danger">{error}</div>
                </Card.Body>
            </Card>
        );
    }

    if (!summary) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <Card className={`mt-4 ${className}`}>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">年度任务进度 ({currentYear})</h4>
                <Badge bg="info" className="fs-6">
                    订单相关任务
                </Badge>
            </Card.Header>
            <Card.Body>
                <Row className="text-center">
                    <Col md={3} className="mb-3">
                        <div className="border rounded p-3 h-100">
                            <h5 className="text-success mb-2">
                                <span className="me-2">✓</span>
                                {summary.completedOrders}
                            </h5>
                            <p className="text-muted mb-0">已完成订单</p>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="border rounded p-3 h-100">
                            <h5 className="text-warning mb-2">
                                <span className="me-2">⏱</span>
                                {summary.inProgressOrders}
                            </h5>
                            <p className="text-muted mb-0">进行中订单</p>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="border rounded p-3 h-100">
                            <h5 className="text-primary mb-2">
                                <span className="me-2">📋</span>
                                {summary.totalOrders}
                            </h5>
                            <p className="text-muted mb-0">总订单数</p>
                        </div>
                    </Col>
                    <Col md={3} className="mb-3">
                        <div className="border rounded p-3 h-100">
                            <h5 className="text-info mb-2">
                                <span className="me-2">%</span>
                                {summary.completionRate}%
                            </h5>
                            <p className="text-muted mb-0">完成率</p>
                        </div>
                    </Col>
                </Row>
                
                {/* Progress Bar */}
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-muted">整体进度</span>
                        <span className="text-muted">{summary.completionRate}%</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                        <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${summary.completionRate}%` }}
                            aria-valuenow={summary.completionRate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        ></div>
                    </div>
                </div>

                {/* Summary Text */}
                <div className="mt-3 text-center">
                    <p className="text-muted mb-0">
                        <small>
                            本年度共处理 <strong>{summary.totalOrders}</strong> 个订单相关任务，
                            其中 <strong className="text-success">{summary.completedOrders}</strong> 个已完成，
                            <strong className="text-warning"> {summary.inProgressOrders}</strong> 个进行中
                        </small>
                    </p>
                </div>
            </Card.Body>
        </Card>
    );
}
