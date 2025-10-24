import { Button, Modal, Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "./Account/reducer";
import { hasAnyRole, Role } from "./utils/roles";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { messageService } from "./services/api";

export default function WelcomeBadge() {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State for announcement modal
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementTitle, setAnnouncementTitle] = useState("");
    const [announcementContent, setAnnouncementContent] = useState("");
    const [messageType, setMessageType] = useState("others");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        //console.log(hour)
        if (6 < hour && hour < 12) {
            return "早上好";
        } else if ((12 < hour || hour == 12) && hour < 18) {
            return "下午好";
        } else if ((18 < hour || hour == 18) && hour < 22) {
            return "晚上好";
        } else {
            return "晚安";
        }
    };

    const logout = () => {
        dispatch(setCurrentUser(null));
        navigate("/Login");
    };

    const openAnnouncementModal = () => {
        setAnnouncementTitle("");
        setAnnouncementContent("");
        setMessageType("others");
        setError("");
        setShowAnnouncementModal(true);
    };

    const handleSubmitAnnouncement = async () => {
        if (!announcementTitle || !announcementContent) {
            setError("Please provide both title and content for your announcement");
            return;
        }

        try {
            setLoading(true);
            await messageService.create({
                messageType: messageType as "new order" | "order status change" | "order update" | "others",
                messageTitle: announcementTitle,
                messageContent: announcementContent,
                postedBy: currentUser.username,
                orderRelated: false
            });

            setShowAnnouncementModal(false);
            setLoading(false);
            // Could add a success message or notification here
        } catch (err) {
            console.error("Failed to create announcement:", err);
            setError("Failed to create announcement. Please try again.");
            setLoading(false);
        }
    };

    if (!currentUser) {
        return null; // Don't show anything if user is not logged in
    }

    return (
        <div className="ezerp-welcome-badge">
            <h1>{getGreeting()}, {currentUser.firstName}</h1>

            <div className="signout-container">
                {hasAnyRole(currentUser, Role.ADMIN) && (
                    <Button
                        onClick={openAnnouncementModal}
                        className="btn-sm btn-primary me-2"
                    >
                        发布公告
                    </Button>
                )}
                <Button onClick={logout} id="ezerp-signout-btn" className="btn-sm btn-danger">
                    登出
                </Button>
            </div>

            {/* Announcement Modal */}
            <Modal show={showAnnouncementModal} onHide={() => setShowAnnouncementModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create Announcement</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <div className="alert alert-danger">{error}</div>}

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>公告类型</Form.Label>
                            <Form.Select
                                value={messageType}
                                onChange={(e) => setMessageType(e.target.value)}
                            >
                                <option value="others">一般公告</option>
                                <option value="new order">订单相关</option>
                                <option value="order status change">订单状态变更</option>
                                <option value="order update">系统更新</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>公告标题*</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="请输入标题"
                                value={announcementTitle}
                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>公告内容*</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                placeholder="请输入公告内容"
                                value={announcementContent}
                                onChange={(e) => setAnnouncementContent(e.target.value)}
                                required
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAnnouncementModal(false)}>
                        取消
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitAnnouncement}
                        disabled={loading}
                    >
                        {loading ? "发布中..." : "发布公告"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}