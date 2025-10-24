import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { authService } from '../services/api';

interface PasswordResponse {
    message: string;
}

export default function PasswordChange() {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        // Validate passwords
        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'danger', text: '新密码不匹配！' });
            setIsSubmitting(false);
            return;
        }

        // Validate password strength
        if (formData.newPassword.length < 3) {
            setMessage({ type: 'danger', text: '新密码必须至少3个字符！' });
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the API to change password using session-based auth
            const response = await authService.changePassword({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword
            });

            // Reset form and show success message
            setFormData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            const responseData = response.data as PasswordResponse;
            setMessage({ type: 'success', text: responseData.message || '密码修改成功！' });
        } catch (err: any) {
            setMessage({
                type: 'danger',
                text: err.response?.data?.message || '密码修改失败。请检查当前密码并重试。'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return <Alert variant="warning">请登录后修改密码。</Alert>;
    }

    return (
        <div className="password-change-container">
            <h2 className="mb-4">修改密码</h2>

            {message.text && (
                <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-3">
                    {message.text}
                </Alert>
            )}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>当前密码</Form.Label>
                            <Form.Control
                                type="password"
                                name="oldPassword"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                required
                                placeholder="输入当前密码"
                                autoComplete="current-password"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>新密码</Form.Label>
                            <Form.Control
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                placeholder="输入新密码"
                                autoComplete="new-password"
                                minLength={6}
                            />
                            <Form.Text className="text-muted">
                                密码必须至少3个字符！
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>确认新密码</Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                placeholder="确认新密码"
                                autoComplete="new-password"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                        <span className="ms-2">修改密码...</span>
                                    </>
                                ) : '修改密码'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 