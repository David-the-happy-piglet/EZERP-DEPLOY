import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentUser } from "../Account/reducer";
import { authService } from "../services/api";

interface LoginResponse {
    message?: string;
    user?: any;
}

export default function Login() {
    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const login = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await authService.login(credentials);
            console.log("Login response:", response);

            if (response.status === 200) {
                const user = (response.data as LoginResponse).user;
                console.log("User data:", user);
                dispatch(setCurrentUser(user));
                navigate("/EZERP/Overview");
            } else {
                setError((response.data as LoginResponse).message || "登录失败：账户或密码错误");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || "登录失败：请检查账户和密码后重试");
        }
    };

    return (
        <div>
            <h1>江苏华能节能科技有限公司</h1>
            <hr />
            {error && <div className="text-danger mb-2">{error}</div>}
            <Form onSubmit={login}>
                <h3>请输入用户名</h3>
                <Form.Control
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    id="erp-username"
                    placeholder="用户名"
                    className="mb-2" />

                <h3>请输入密码</h3>
                <Form.Control
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    id="erp-password"
                    placeholder="密码"
                    type="password"
                    className="mb-2" />

                <br />
                <br />
                <br />
                <Button type="submit" id="erp-signin-btn" className="w-50 mb-2 bg-success">登录</Button>
            </Form>
        </div>
    );
}