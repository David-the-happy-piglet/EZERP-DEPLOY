import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { setCurrentUser } from './reducer';
import { authService } from '../services/api';

interface UserProfileResponse {
    user?: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}

export default function Profile() {
    const dispatch = useDispatch();
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        role: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                department: currentUser.department || '',
                role: currentUser.role || ''
            });
        }
    }, [currentUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Make API call to update user
            // Check if we have id or _id in the currentUser object
            const userId = currentUser.id || currentUser._id;

            if (!userId) {
                throw new Error('User ID is missing. Please log in again.');
            }

            await authService.updateUser(userId, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            });

            // Fetch updated user data
            const response = await authService.getCurrentUser();
            const responseData = response.data as UserProfileResponse;
            const userData = responseData.user || responseData;

            // Update Redux store with the updated user
            dispatch(setCurrentUser(userData));

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);
        } catch (error: any) {
            console.error('Profile update error:', error);
            setMessage({
                type: 'danger',
                text: error.response?.data?.message || error.message || 'Failed to update profile'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return <Alert variant="warning">请登录后查看个人信息。</Alert>;
    }

    return (
        <div className="profile-container">
            <h2 className="mb-4">个人信息</h2>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '10px 15px',
                borderRadius: '5px',
                display: 'inline-block',
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <span style={{
                    fontWeight: 'bold',
                    marginRight: '10px',
                    color: '#6c757d'
                }}>角色:</span>
                <span style={{
                    color: '#0d6efd',
                    fontWeight: '500'
                }}>{currentUser.role || 'N/A'}</span>
            </div>

            {message.text && (
                <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-3">
                    {message.text}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>名</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>姓</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
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
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </Form.Group>
                            </Col>

                            {/* <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>电话</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                    />
                                </Form.Group>
                            </Col> */}
                        </Row>

                        <div className="d-flex justify-content-end mt-4">
                            {isEditing ? (
                                <>
                                    <Button variant="secondary" className="me-2" onClick={() => setIsEditing(false)}>
                                        取消
                                    </Button>
                                    <Button variant="primary" type="submit" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                                <span className="ms-2">保存...</span>
                                            </>
                                        ) : (
                                            "保存更改"
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button variant="primary" onClick={() => setIsEditing(true)}>
                                    编辑个人信息
                                </Button>
                            )}
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 