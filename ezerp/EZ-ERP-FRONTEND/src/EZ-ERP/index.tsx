import { Navigate, Route, Routes } from "react-router-dom";
import WelcomeBadge from "./WelcomeBadge";
import Account from "./Account";
import Customer from "./Customer";
import Orders from "./Orders";
import Finance from "./Finance";
import Overview from "./Overview";
import MainPageNav from "./MainPageNav";
import ProtectedRoute from "./Login/ProtectedRoute";
import HumanResource from "./HumanResource";
import ProjectManagement from "./PM";
import Tasks from "./PM/Tasks";
import './style.css';
import OrderCreate from "./Orders/orderCreate";
import OrderEdit from "./Orders/orderEdit";

export default function EZ_ERP() {
    return (
        <div id="ezerp" className="ezerp-container">

            <WelcomeBadge />


            <div className="ezerp-main-container">

                <MainPageNav />


                <div id="ezerp-content" className="ezerp-main-content">
                    <Routes>
                        <Route path="Overview/*" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
                        <Route path="" element={<Navigate to="Overview" />} />
                        <Route path="Orders/*" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="Orders/:orderNumber" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="Orders/:orderNumber/edit" element={<ProtectedRoute><OrderEdit /></ProtectedRoute>} />
                        <Route path="Orders/new" element={<ProtectedRoute><OrderCreate /></ProtectedRoute>} />
                        <Route path="PM" element={<ProtectedRoute><ProjectManagement /></ProtectedRoute>} />
                        <Route path="PM/:orderNumber/Tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                        <Route path="Customers/*" element={<ProtectedRoute><Customer /></ProtectedRoute>} />
                        <Route path="Finance/*" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                        <Route path="Account/*" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                        <Route path="HR/*" element={<ProtectedRoute><HumanResource /></ProtectedRoute>} />
                    </Routes>
                </div>
            </div>
        </div>
    )
}