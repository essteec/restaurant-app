import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Layout from "../components/ui/Layout.jsx";
import HomePage from "../pages/HomePage.jsx";
import MenuPage from "../pages/public/MenuPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import CustomerOrdersPage from "@pages/customer/CustomerOrdersPage.jsx";
import OrderTrackingPage from "@pages/customer/OrderTrackingPage.jsx";
import CartPage from "../pages/customer/CartPage.jsx";
import CheckoutPage from "../pages/customer/CheckoutPage.jsx";
import AdminUsersPage from "@pages/staff/admin/AdminUsersPage.jsx";
import AdminDashboardPage from "@pages/staff/admin/AdminDashboardPage.jsx";
import AdminMenuPage from "../pages/staff/admin/AdminMenuPage.jsx";
import AdminFoodItemsPage from "../pages/staff/admin/AdminFoodItemsPage.jsx";
import AdminTablesPage from "../pages/staff/admin/AdminTablesPage.jsx";
import AdminTableQRCodesPage from "../pages/staff/admin/AdminTableQRCodesPage.jsx";
import AdminCategoriesPage from "../pages/staff/admin/AdminCategoriesPage.jsx";
import AdminTranslationsPage from "../pages/staff/admin/AdminTranslationsPage.jsx";
import WaiterTablesPage from "../pages/staff/waiter/WaiterTablesPage.jsx";
import ProfilePage from "../pages/customer/ProfilePage.jsx";
import EmployeeProfilePage from "../pages/staff/EmployeeProfilePage.jsx";
import routes from "./routes.js";
import useAuth from "../contexts/use-auth.js";
import AdminOrdersPage from "@pages/staff/admin/AdminOrdersPage.jsx";
import AdminCallRequestsPage from "@pages/staff/admin/AdminCallRequestsPage.jsx";
import WaiterCallRequestsPage from "../pages/staff/waiter/WaiterCallRequestsPage.jsx";
import WaiterOperationPage from "../pages/staff/waiter/WaiterOperationPage.jsx";
import OrdersViewPage from "@pages/staff/OrdersViewPage.jsx";
import StaffOrdersPage from "@pages/staff/StaffOrdersPage.jsx";
import LandingPage from "@pages/public/LandingPage.jsx";


const AppRouter = () => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner
    }

    const CustomerRoute = ({ children }) => {
        if (!isAuthenticated || user?.role !== 'CUSTOMER') {
            return <Navigate to={routes.HOME} replace />;
        }
        return children;
    };

    const AdminRoute = ({ children }) => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            return <Navigate to={routes.HOME} replace />;
        }
        return children;
    };

    const ChefRoute = ({ children }) => {
        if (!isAuthenticated || (user?.role !== 'CHEF' && user?.role !== 'ADMIN')) {
            return <Navigate to={routes.HOME} replace />;
        }
        return children;
    };

    const WaiterRoute = ({ children }) => {
        if (!isAuthenticated || (user?.role !== 'WAITER' && user?.role !== 'ADMIN')) {
            return <Navigate to={routes.HOME} replace />;
        }
        return children;
    };

    const StaffRoute = ({ children }) => {
        if (!isAuthenticated || (user?.role !== 'CHEF' && user?.role !== 'WAITER' && user?.role !== 'ADMIN')) {
            return <Navigate to={routes.HOME} replace />;
        }
        return children;
    };

    return (
        <Router>
            <Layout>
                <Routes>
                    {/*Public routes*/}
                    <Route path={routes.HOME} element={<HomePage/>} />
                    <Route path={routes.MENU} element={<MenuPage/>} />
                    <Route path={routes.LANDING} element={<LandingPage/>} />
                    <Route path={routes.LOGIN} element={<LoginPage/>} />
                    <Route path={routes.REGISTER} element={<RegisterPage/>} />
                    <Route path={routes.CART} element={<CartPage/>} />
                    <Route path={routes.CHECKOUT} element={<CheckoutPage/>} />

                    {/*Customer routes*/}
                    <Route path={routes.ORDERS} element={<CustomerOrdersPage/>} />
                    <Route path={routes.ORDER_TRACKING} element={
                        <CustomerRoute>
                            <OrderTrackingPage/>
                        </CustomerRoute>
                    } />
                    // ProfilePage if user is customer else EmployeeProfilePage
                    <Route path={routes.PROFILE} element={user?.role === 'CUSTOMER' ? <ProfilePage/> : <EmployeeProfilePage/>} />

                    <Route path={routes.ADMIN_ANALYTICS} element={
                        <AdminRoute>
                            <AdminDashboardPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_USERS} element={
                        <AdminRoute>
                            <AdminUsersPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_MENUS} element={
                        <AdminRoute>
                            <AdminMenuPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_FOOD_ITEMS} element={
                        <AdminRoute>
                            <AdminFoodItemsPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_TRANSLATIONS} element={
                        <AdminRoute>
                            <AdminTranslationsPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_TABLES} element={
                        <AdminRoute>
                            <AdminTablesPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_TABLE_QR_CODES} element={
                        <AdminRoute>
                            <AdminTableQRCodesPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_CATEGORIES} element={
                        <AdminRoute>
                            <AdminCategoriesPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_ORDERS} element={
                        <AdminRoute>
                            <AdminOrdersPage />
                        </AdminRoute>
                    } />
                    <Route path={routes.ADMIN_CALL_REQUESTS} element={
                        <AdminRoute>
                            <AdminCallRequestsPage />
                        </AdminRoute>
                    } />

                    {/*Employee routes*/}
                    <Route path={routes.CHEF_ORDERS} element={
                        <ChefRoute>
                            <StaffOrdersPage />
                        </ChefRoute>
                    } />

                    <Route path={routes.CHEF_ORDERS_VIEW} element={
                        <ChefRoute>
                            <OrdersViewPage />
                        </ChefRoute>
                    } />

                    <Route path={routes.WAITER_ORDERS} element={
                        <WaiterRoute>
                            <StaffOrdersPage />
                        </WaiterRoute>
                    } />
                    <Route path={routes.WAITER_TABLES} element={
                        <WaiterRoute>
                            <WaiterTablesPage />
                        </WaiterRoute>
                    } />
                    <Route path={routes.WAITER_CALL_REQUESTS} element={
                        <WaiterRoute>
                            <WaiterCallRequestsPage />
                        </WaiterRoute>
                    } />

                    <Route path={routes.WAITER_OPERATIONS} element={
                        <WaiterRoute>
                            <WaiterOperationPage />
                        </WaiterRoute>
                    } />

                    <Route path={routes.WAITER_ORDERS_VIEW} element={
                        <WaiterRoute>
                            <OrdersViewPage />
                        </WaiterRoute>
                    } />

                    {/*Catch all routes as 404*/}
                    <Route path="*" element={
                        <div className="container mt-4 text-center">
                            <h2>Page Not Found</h2>
                            <p>This page doesnt exist.</p>
                        </div>
                    } />
                </Routes>
            </Layout>
        </Router>
    );
}

export default AppRouter;