import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const currentUser = useSelector((state: any) => state.accountReducer?.currentUser);

    if (!currentUser) {
        return <Navigate to="/Login" replace />;
    }

    return <>{children}</>;
}
