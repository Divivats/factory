import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
    return (
        <div className="factory-container">
            <Sidebar />
            <div className="factory-main">
                <Outlet />
            </div>
        </div>
    )
}