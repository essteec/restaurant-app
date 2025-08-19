const routes = {
	// Public routes
	HOME: '/',
	LOGIN: '/login',
	REGISTER: '/register',
	MENU: '/menu',

    // Customer routes
	ORDERS: '/orders',
    ORDER_TRACKING: '/orders/last',
    CART: '/cart',
    CHECKOUT: '/checkout',
    PROFILE: '/profile',

    // Employee routes
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_MENUS: '/admin/menus',
    ADMIN_FOOD_ITEMS: '/admin/foods',
    ADMIN_TABLES: '/admin/tables',
    ADMIN_CATEGORIES: '/admin/categories',
    ADMIN_ANALYTICS: '/admin/analytics',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_CALL_REQUESTS: '/admin/call-requests',

    WAITER: '/waiter',
    WAITER_ORDERS: '/waiter/orders',
    WAITER_OPERATIONS: '/waiter/operations',
    WAITER_TABLES: '/waiter/tables',
    WAITER_CALL_REQUESTS: '/waiter/call-requests',
    WAITER_ORDERS_VIEW: '/waiter/orders-view',

    CHEF: '/chef',
    CHEF_ORDERS: '/chef/orders',
    CHEF_ORDERS_VIEW: '/chef/orders-view',
}

export default routes;