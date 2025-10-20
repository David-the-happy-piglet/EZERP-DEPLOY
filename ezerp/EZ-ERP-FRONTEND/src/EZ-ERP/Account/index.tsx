import { Row, Col, Nav, Card } from 'react-bootstrap';
import { useState } from 'react';
import Profile from './Profile';
import PasswordChange from './PasswordChange';

export default function Account() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="h-100">
            <Card className="h-100">
                <Card.Header>
                    <h2 className="mb-0">Account Settings</h2>
                </Card.Header>
                <Card.Body className="overflow-auto">
                    <Row className="h-100">
                        <Col md={3} className="account-sidebar-new">
                            <Nav className="flex-column">
                                <Nav.Link
                                    active={activeTab === 'profile'}
                                    onClick={() => setActiveTab('profile')}
                                    className="account-nav-link"
                                >
                                    Profile
                                </Nav.Link>

                                <Nav.Link
                                    active={activeTab === 'password'}
                                    onClick={() => setActiveTab('password')}
                                    className="account-nav-link"
                                >
                                    Change Password
                                </Nav.Link>
                            </Nav>
                        </Col>
                        <Col md={9} className="account-content-new">
                            {activeTab === 'profile' && <Profile />}
                            {activeTab === 'password' && <PasswordChange />}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
}