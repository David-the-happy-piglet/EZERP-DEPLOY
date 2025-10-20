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
                setError((response.data as LoginResponse).message || "Login failed: Invalid credentials");
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || "Login failed: Please check your credentials and try again");
        }
    };

    return (
        <div>
            <h1>Welcome to EZ-ERP</h1>
            <hr />
            {error && <div className="text-danger mb-2">{error}</div>}
            <Form onSubmit={login}>
                <h3>Please enter your username</h3>
                <Form.Control
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    id="erp-username"
                    placeholder="username"
                    className="mb-2" />

                <h3>Please enter your password</h3>
                <Form.Control
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    id="erp-password"
                    placeholder="password"
                    type="password"
                    className="mb-2" />

                <br />
                <br />
                <br />
                <Button type="submit" id="erp-signin-btn" className="w-50 mb-2 bg-success">Login</Button>
            </Form>
        </div>
    );
}