import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div>

            <h1><Nav.Item>
                <Nav.Link as={Link} to="/EZERP/Overview" id="EZ-ERP">EZ-ERP</Nav.Link>
            </Nav.Item></h1>
            <hr />
            <h3>By: Wenjie Liu</h3>
            <h3>Email: liu.wenji@northeastern.edu</h3>
            <h3>Github repo-frontend: <a href="https://github.com/David-the-happy-piglet/EZ-ERP-FRONTEND">https://github.com/David-the-happy-piglet/EZ-ERP-FRONTEND</a></h3>
            <h3>Github repo-backend: <a href="https://github.com/David-the-happy-piglet/EZ-ERP-BACKEND">https://github.com/David-the-happy-piglet/EZ-ERP-BACKEND</a></h3>
        </div>
    )
}