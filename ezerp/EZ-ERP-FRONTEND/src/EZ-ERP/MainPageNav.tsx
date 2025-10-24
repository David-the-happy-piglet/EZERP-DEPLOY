import { Link, useLocation } from "react-router-dom";

import { ListGroup } from "react-bootstrap";
import { MdManageAccounts } from "react-icons/md";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { MdGroups } from "react-icons/md";
import { FaHandshake } from "react-icons/fa";
import { FaWarehouse } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { FaChartGantt } from "react-icons/fa6";
export default function MainPageNav() {
    const { pathname } = useLocation();

    const links = [
        { label: "总览", path: "/EZERP/Overview", icon: MdDashboard },
        { label: "项目管理", path: "/EZERP/PM", icon: FaChartGantt },
        { label: "订单", path: "/EZERP/Orders", icon: FaWarehouse },
        { label: "客户", path: "/EZERP/Customers", icon: FaHandshake },
        { label: "财务", path: "/EZERP/Finance", icon: FaMoneyBillTransfer },
        { label: "账户", path: "/EZERP/Account", icon: MdManageAccounts },
        { label: "人员", path: "/EZERP/HR", icon: MdGroups }
    ];

    return (
        <div>
            <ListGroup
                id="ezerp-main-nav"
                style={{ width: 120, left: 0, top: 88 }}
                className="list-group rounded-0 position-fixed bottom-0 d-none d-md-block .bg-body z-2"
            >
                {links.map((link) => (
                    <ListGroup.Item
                        key={`${link.path}-${link.label}`}
                        as={Link}
                        to={link.path}
                        className={`bg-body text-center border-0
                        ${pathname.includes(link.path)
                                ? "text-primary bg-dark-subtle"
                                : "text-dark bg-body"}`}
                    >
                        {link.icon({ className: "fs-1" })}
                        <br />
                        {link.label}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
}