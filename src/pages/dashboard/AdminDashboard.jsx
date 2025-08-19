import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import apiClient from '../../api/index.js';
import useAuth from '../../contexts/use-auth.js';
import routes from '../../routes/routes.js';
import UserWelcome from './components/UserWelcome.jsx';
import QuickActions from './components/QuickActions.jsx';
import { LoadingSpinner, DataTable } from '../../components/index.js';
import { useToast } from '../../hooks/useToast.js';
import { formatCurrency } from '../../utils/helpers.js';

const AdminDashboard = () => {
    const { user, isAuthenticated } = useAuth();

    // Analytics state
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState('week');
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    // Dashboard data states
    const [dashboardStats, setDashboardStats] = useState({});
    const [revenueChart, setRevenueChart] = useState([]);
    const [revenueHeatmap, setRevenueHeatmap] = useState([]);
    const [topItems, setTopItems] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [busiestTables, setBusiestTables] = useState([]);

    const { showToast } = useToast();

    // Date range presets with enhanced options
    const datePresets = [
        {
            key: 'today',
            label: 'Today',
            icon: 'bi bi-calendar-day',
            color: 'primary',
            getDates: () => {
                const today = new Date();
                return {
                    startDate: today.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'yesterday',
            label: 'Yesterday',
            icon: 'bi bi-calendar-minus',
            color: 'secondary',
            getDates: () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: yesterday.toISOString().split('T')[0],
                    endDate: yesterday.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'week',
            label: 'This Week',
            icon: 'bi bi-calendar-week',
            color: 'success',
            getDates: () => {
                const today = new Date();
                const endDate = new Date();
                const startOfWeek = new Date(today);

                // Get start of week (Monday)
                const dayOfWeek = today.getDay();
                const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startOfWeek.setDate(today.getDate() - daysToSubtract);

                return {
                    startDate: startOfWeek.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'month',
            label: 'This Month',
            icon: 'bi bi-calendar-month',
            color: 'info',
            getDates: () => {
                const today = new Date();
                const endDate = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                return {
                    startDate: startOfMonth.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'quarter',
            label: 'This Quarter',
            icon: 'bi bi-calendar4-range',
            color: 'warning',
            getDates: () => {
                const today = new Date();
                const endDate = new Date();
                const currentQuarter = Math.floor(today.getMonth() / 3);
                const startOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1);

                return {
                    startDate: startOfQuarter.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'year',
            label: 'This Year',
            icon: 'bi bi-calendar-range',
            color: 'dark',
            getDates: () => {
                const today = new Date();
                const endDate = new Date();
                const startOfYear = new Date(today.getFullYear(), 0, 1);

                return {
                    startDate: startOfYear.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                };
            }
        },
        {
            key: 'alltime',
            label: 'All Time',
            icon: 'bi bi-infinity',
            color: 'success',
            getDates: () => {
                return {
                    startDate: '',
                    endDate: ''
                };
            }
        },
        {
            key: 'custom',
            label: 'Custom Range',
            icon: 'bi bi-calendar-range',
            color: 'outline-primary',
            getDates: () => ({ startDate: null, endDate: null })
        }
    ];

    // Quick action buttons for admin
    const adminActions = [
        {
            to: routes.ADMIN_USERS,
            label: 'User Monitoring',
            variant: 'primary',
            icon: 'bi bi-people',
            description: 'Manage users, roles, and permissions'
        },
        {
            to: routes.ADMIN_ORDERS,
            label: 'Order Monitoring',
            variant: 'success',
            icon: 'bi bi-receipt',
            description: 'View and manage customer orders'
        },
        {
            to: routes.ADMIN_CALL_REQUESTS,
            label: 'Call Request Monitoring',
            variant: 'danger',
            icon: 'bi bi-telephone',
            description: 'Handle customer service calls'
        },
        {
            to: routes.ADMIN_MENUS,
            label: 'Menu Management',
            variant: 'outline-warning',
            icon: 'bi bi-list-task',
            description: 'Create and manage menus'
        },
        {
            to: routes.ADMIN_TABLES,
            label: 'Table Management',
            variant: 'outline-info',
            icon: 'bi bi-table',
            description: 'Manage restaurant tables'
        },
        {
            to: routes.ADMIN_FOOD_ITEMS,
            label: 'Food Item Management',
            variant: 'outline-secondary',
            icon: 'bi bi-grid',
            description: 'Manage food items and pricing'
        }
    ];

    useEffect(() => {
        if (isAuthenticated && user?.role === 'ADMIN') {
            // Set default to today
            handlePresetChange('today');
        }
    }, [isAuthenticated, user]);

    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey);
        const preset = datePresets.find(p => p.key === presetKey);

        if (presetKey === 'custom') {
            setShowCustomRange(true);
            // Don't fetch data immediately for custom range
        } else {
            setShowCustomRange(false);
            const dates = preset.getDates();
            setDateRange(dates);
            // Fetch data immediately for preset ranges
            fetchAllAnalyticsWithDates(dates);
        }
    };

    const handleCustomDateApply = () => {
        if (dateRange.startDate && dateRange.endDate) {
            fetchAllAnalyticsWithDates(dateRange);
            showToast('Custom date range applied successfully', 'success');
        } else {
            showToast('Please select both start and end dates', 'error');
        }
    };

    const buildDateParams = (dates = null) => {
        const activeDates = dates || dateRange;
        const params = new URLSearchParams();
        if (activeDates.startDate) params.append('startDate', activeDates.startDate);
        if (activeDates.endDate) params.append('endDate', activeDates.endDate);
        return params.toString();
    };

    const fetchAllAnalytics = async () => {
        await fetchAllAnalyticsWithDates(dateRange);
    };

    const fetchAllAnalyticsWithDates = async (dates) => {
        setAnalyticsLoading(true);
        try {
            await Promise.all([
                fetchDashboardStats(dates),
                fetchRevenueChart(dates),
                fetchRevenueHeatmap(dates),
                fetchTopItems(dates),
                fetchTopCategories(dates),
                fetchBusiestTables(dates)
            ]);
            setAnalyticsError(null);
        } catch (err) {
            setAnalyticsError('Failed to fetch analytics data.');
            showToast('Failed to fetch analytics data', 'error');
            console.error('Analytics fetch error:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const fetchDashboardStats = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            const response = await apiClient.get(`/admin/dashboard/stats?${params}`);
            setDashboardStats(response.data || {});
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        }
    };

    const fetchRevenueChart = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            const response = await apiClient.get(`/admin/dashboard/revenue-chart?${params}`);
            setRevenueChart(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch revenue chart:', err);
            setRevenueChart([]);
        }
    };

    const fetchRevenueHeatmap = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            const response = await apiClient.get(`/admin/dashboard/revenue-heatmap?${params}`);
            setRevenueHeatmap(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed to fetch revenue heatmap:', err);
            setRevenueHeatmap([]);
        }
    };

    const fetchTopItems = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            if (params) {
                const response = await apiClient.get(`/admin/dashboard/top-items?${params}&page=0&size=10`);
                setTopItems(response.data.content || response.data || []);
            } else {
                const response = await apiClient.get('/admin/dashboard/top-items?page=0&size=10');
                setTopItems(response.data.content || response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch top items:', err);
            setTopItems([]);
        }
    };

    const fetchTopCategories = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            if (params) {
                const response = await apiClient.get(`/admin/dashboard/top-categories?${params}&page=0&size=10`);
                setTopCategories(response.data.content || response.data || []);
            } else {
                const response = await apiClient.get('/admin/dashboard/top-categories?page=0&size=10');
                setTopCategories(response.data.content || response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch top categories:', err);
            setTopCategories([]);
        }
    };

    const fetchBusiestTables = async (dates = null) => {
        try {
            const params = buildDateParams(dates);
            if (params) {
                const response = await apiClient.get(`/admin/dashboard/busiest-tables?${params}&page=0&size=10`);
                setBusiestTables(response.data.content || response.data || []);
            } else {
                const response = await apiClient.get('/admin/dashboard/busiest-tables?page=0&size=10');
                setBusiestTables(response.data.content || response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch busiest tables:', err);
            setBusiestTables([]);
        }
    };

    const handleDateRangeChange = (field, value) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
    };

    const handleRefreshData = () => {
        if (selectedPreset === 'custom') {
            handleCustomDateApply();
        } else {
            handlePresetChange(selectedPreset);
        }
        showToast('Dashboard refreshed successfully', 'success');
    };

    // Enhanced DataTable columns for analytics
    const topItemsColumns = [
        {
            key: 'rank',
            header: 'Rank',
            render: (value, item, index) => (
                <Badge bg={index < 3 ? 'warning' : 'secondary'} className="fs-6">
                    #{index + 1}
                </Badge>
            )
        },
        {
            key: 'foodName',
            header: 'Food Item',
            accessor: 'foodName',
            sortable: true,
            render: (value) => (
                <div>
                    <strong>{value}</strong>
                </div>
            )
        },
        {
            key: 'quantitySold',
            header: 'Qty Sold',
            accessor: 'quantitySold',
            sortable: true,
            render: (value) => (
                <Badge bg="info" className="fs-6">
                    {value} units
                </Badge>
            )
        },
        {
            key: 'totalRevenue',
            header: 'Revenue',
            accessor: 'totalRevenue',
            sortable: true,
            render: (value) => (
                <strong className="text-success">
                    {formatCurrency(value)}
                </strong>
            )
        }
    ];

    const topCategoriesColumns = [
        {
            key: 'rank',
            header: 'Rank',
            render: (value, item, index) => (
                <Badge bg={index < 3 ? 'success' : 'secondary'} className="fs-6">
                    #{index + 1}
                </Badge>
            )
        },
        {
            key: 'categoryName',
            header: 'Category',
            accessor: 'categoryName',
            sortable: true,
            render: (value) => (
                <div>
                    <i className="bi bi-tag me-2"></i>
                    <strong>{value}</strong>
                </div>
            )
        },
        {
            key: 'totalRevenue',
            header: 'Total Revenue',
            accessor: 'totalRevenue',
            sortable: true,
            render: (value) => (
                <strong className="text-success">
                    {formatCurrency(value)}
                </strong>
            )
        }
    ];

    const busiestTablesColumns = [
        {
            key: 'rank',
            header: 'Rank',
            render: (value, item, index) => (
                <Badge bg={index < 3 ? 'primary' : 'secondary'} className="fs-6">
                    #{index + 1}
                </Badge>
            )
        },
        {
            key: 'tableNumber',
            header: 'Table',
            accessor: 'tableNumber',
            sortable: true,
            render: (value) => (
                <div>
                    <i className="bi bi-table me-2"></i>
                    <strong>{value}</strong>
                </div>
            )
        },
        {
            key: 'orderCount',
            header: 'Orders',
            accessor: 'orderCount',
            sortable: true,
            render: (value) => (
                <Badge bg="warning" className="fs-6">
                    {value} orders
                </Badge>
            )
        }
    ];

    if (!isAuthenticated || user?.role !== 'ADMIN') {
        return (
            <Container className="mt-4">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Access Denied</h4>
                    <p>You do not have administrative privileges to view this dashboard.</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">

            {/* Analytics & Reports Section */}
            <Row className="mt-4 pb-5">
                <Col>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <h3 className="mb-0">
                                    <i className="bi bi-graph-up me-2"></i>
                                    Analytics & Business Intelligence
                                </h3>
                                <Button variant="light" onClick={handleRefreshData}>
                                    <i className="bi bi-arrow-clockwise me-2"></i>
                                    Refresh Data
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {/* Enhanced Date Range Selection */}
                            <Row className="mb-4">
                                <Col>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">
                                            <i className="bi bi-calendar3 me-2"></i>
                                            Time Period Analysis
                                        </h5>
                                        <Badge bg="primary" className="fs-6 px-3 py-2">
                                            <i className={`${datePresets.find(p => p.key === selectedPreset)?.icon} me-2`}></i>
                                            {datePresets.find(p => p.key === selectedPreset)?.label}
                                        </Badge>
                                    </div>

                                    {/* Enhanced Preset Date Range Buttons */}
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {datePresets.map((preset) => (
                                            <Button
                                                key={preset.key}
                                                variant={selectedPreset === preset.key ? preset.color : `outline-${preset.color}`}
                                                size="sm"
                                                onClick={() => handlePresetChange(preset.key)}
                                                className="d-flex align-items-center"
                                            >
                                                <i className={`${preset.icon} me-2`}></i>
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Custom Date Range (shown when custom is selected) */}
                                    {showCustomRange && (
                                        <Card className="bg-light mb-3">
                                            <Card.Body>
                                                <Row>
                                                    <Col md={4}>
                                                        <Form.Group>
                                                            <Form.Label>
                                                                <i className="bi bi-calendar-event me-2"></i>
                                                                Start Date
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                value={dateRange.startDate}
                                                                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4}>
                                                        <Form.Group>
                                                            <Form.Label>
                                                                <i className="bi bi-calendar-check me-2"></i>
                                                                End Date
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="date"
                                                                value={dateRange.endDate}
                                                                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                                                            />
                                                        </Form.Group>
                                                    </Col>
                                                    <Col md={4} className="d-flex align-items-end">
                                                        <Button
                                                            variant="success"
                                                            onClick={handleCustomDateApply}
                                                            className="w-100"
                                                            disabled={!dateRange.startDate || !dateRange.endDate}
                                                        >
                                                            <i className="bi bi-check-circle me-2"></i>
                                                            Apply Custom Range
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </Card.Body>
                                        </Card>
                                    )}

                                    {/* Current Date Range Display */}
                                    <div className="bg-light p-3 rounded mb-3 border">
                                        {selectedPreset === 'alltime' ? (
                                            <div className="text-center">
                                                <i className="bi bi-infinity me-2 text-primary fs-4"></i>
                                                <strong className="fs-5">All Time Analytics</strong>
                                                <div className="text-muted">Complete Historical Data Analysis</div>
                                            </div>
                                        ) : dateRange.startDate && dateRange.endDate ? (
                                            <div className="text-center">
                                                <strong className="fs-5">
                                                    {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                                                </strong>
                                                <div className="text-muted">
                                                    ({Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)) + 1} days analysis period)
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <strong className="text-muted">
                                                    {selectedPreset === 'custom' ? 'Please select date range' : 'Loading...'}
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {analyticsLoading ? (
                                <div className="text-center py-5">
                                    <LoadingSpinner size="lg" />
                                    <h4 className="mt-3">Loading Analytics...</h4>
                                    <p className="text-muted">Analyzing business data and generating insights</p>
                                </div>
                            ) : analyticsError ? (
                                <div className="alert alert-danger" role="alert">
                                    <h4 className="alert-heading">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Analytics Error
                                    </h4>
                                    <p>{analyticsError}</p>
                                    <hr />
                                    <Button variant="outline-danger" onClick={handleRefreshData}>
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Try Again
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Enhanced Dashboard Statistics Cards */}
                                    <Row className="mb-4">
                                        <Col md={3}>
                                            <Card className="text-center border-primary shadow-sm h-100">
                                                <Card.Body>
                                                    <div className="display-6 text-primary mb-2">
                                                        <i className="bi bi-currency-dollar"></i>
                                                    </div>
                                                    <h3 className="text-primary">{formatCurrency(dashboardStats.totalRevenue || 0)}</h3>
                                                    <p className="text-muted mb-0">Total Revenue</p>
                                                    <small className="text-muted">Gross sales income</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="text-center border-success shadow-sm h-100">
                                                <Card.Body>
                                                    <div className="display-6 text-success mb-2">
                                                        <i className="bi bi-receipt"></i>
                                                    </div>
                                                    <h3 className="text-success">{dashboardStats.totalOrders || 0}</h3>
                                                    <p className="text-muted mb-0">Total Orders</p>
                                                    <small className="text-muted">Completed transactions</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="text-center border-info shadow-sm h-100">
                                                <Card.Body>
                                                    <div className="display-6 text-info mb-2">
                                                        <i className="bi bi-graph-up-arrow"></i>
                                                    </div>
                                                    <h3 className="text-info">{formatCurrency(dashboardStats.averageOrderValue || 0)}</h3>
                                                    <p className="text-muted mb-0">Average Order Value</p>
                                                    <small className="text-muted">Revenue per order</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col md={3}>
                                            <Card className="text-center border-warning shadow-sm h-100">
                                                <Card.Body>
                                                    <div className="display-6 text-warning mb-2">
                                                        <i className="bi bi-person-plus"></i>
                                                    </div>
                                                    <h3 className="text-warning">{dashboardStats.newCustomers || 0}</h3>
                                                    <p className="text-muted mb-0">New Customers</p>
                                                    <small className="text-muted">Customer acquisition</small>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Revenue Over Time Chart */}
                                    {Array.isArray(revenueChart) && revenueChart.length > 0 && (
                                        <Row className="mb-4">
                                            <Col md={12}>
                                                <Card className="shadow-sm">
                                                    <Card.Header className="bg-gradient-primary text-white">
                                                        <h5 className="mb-0">
                                                            <i className="bi bi-graph-up me-2"></i>
                                                            Revenue Trend Analysis
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="table-responsive">
                                                            <table className="table table-hover">
                                                                <thead className="table-dark">
                                                                <tr>
                                                                    <th>
                                                                        <i className="bi bi-calendar3 me-2"></i>
                                                                        Period
                                                                    </th>
                                                                    <th>
                                                                        <i className="bi bi-currency-dollar me-2"></i>
                                                                        Revenue
                                                                    </th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {revenueChart.map((point, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <Badge bg="secondary">{point.label}</Badge>
                                                                        </td>
                                                                        <td>
                                                                            <strong className="text-success">
                                                                                {formatCurrency(point.revenue)}
                                                                            </strong>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )}

                                    {/* Enhanced Performance Analytics */}
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <Card className="shadow-sm h-100">
                                                <Card.Header className="bg-success text-white">
                                                    <h6 className="mb-0">
                                                        <i className="bi bi-trophy me-2"></i>
                                                        Top Performing Items
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <DataTable
                                                        data={Array.isArray(topItems) ? topItems : []}
                                                        columns={topItemsColumns}
                                                        loading={false}
                                                        searchable={false}
                                                        paginated={false}
                                                        emptyMessage="No sales data available for this period"
                                                        striped={true}
                                                        hover={true}
                                                    />
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col md={4}>
                                            <Card className="shadow-sm h-100">
                                                <Card.Header className="bg-info text-white">
                                                    <h6 className="mb-0">
                                                        <i className="bi bi-tags me-2"></i>
                                                        Top Categories
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <DataTable
                                                        data={Array.isArray(topCategories) ? topCategories : []}
                                                        columns={topCategoriesColumns}
                                                        loading={false}
                                                        searchable={false}
                                                        paginated={false}
                                                        emptyMessage="No category data available for this period"
                                                        striped={true}
                                                        hover={true}
                                                    />
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col md={4}>
                                            <Card className="shadow-sm h-100">
                                                <Card.Header className="bg-warning text-dark">
                                                    <h6 className="mb-0">
                                                        <i className="bi bi-building me-2"></i>
                                                        Busiest Tables
                                                    </h6>
                                                </Card.Header>
                                                <Card.Body>
                                                    <DataTable
                                                        data={Array.isArray(busiestTables) ? busiestTables : []}
                                                        columns={busiestTablesColumns}
                                                        loading={false}
                                                        searchable={false}
                                                        paginated={false}
                                                        emptyMessage="No table data available for this period"
                                                        striped={true}
                                                        hover={true}
                                                    />
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Revenue Heatmap Analysis */}
                                    {Array.isArray(revenueHeatmap) && revenueHeatmap.length > 0 && (
                                        <Row className="mb-4">
                                            <Col md={12}>
                                                <Card className="shadow-sm">
                                                    <Card.Header className="bg-dark text-white">
                                                        <h5 className="mb-0">
                                                            <i className="bi bi-heat-map me-2"></i>
                                                            Revenue Heatmap (Peak Hours Analysis)
                                                        </h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <div className="table-responsive">
                                                            <table className="table table-hover">
                                                                <thead className="table-dark">
                                                                <tr>
                                                                    <th>
                                                                        <i className="bi bi-calendar-week me-2"></i>
                                                                        Day of Week
                                                                    </th>
                                                                    <th>
                                                                        <i className="bi bi-clock me-2"></i>
                                                                        Hour
                                                                    </th>
                                                                    <th>
                                                                        <i className="bi bi-currency-dollar me-2"></i>
                                                                        Revenue
                                                                    </th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {revenueHeatmap.slice(0, 20).map((point, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <Badge bg="secondary" className="fs-6">
                                                                                {point.dayOfWeek}
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <Badge bg="primary" className="fs-6">
                                                                                {point.hourOfDay}:00
                                                                            </Badge>
                                                                        </td>
                                                                        <td>
                                                                            <strong className="text-success">
                                                                                {formatCurrency(point.revenue)}
                                                                            </strong>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {revenueHeatmap.length > 20 && (
                                                            <div className="text-center mt-3">
                                                                <Badge bg="info" className="fs-6">
                                                                    Showing top 20 of {revenueHeatmap.length} time periods
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    )}
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>


            {/* Welcome Section */}
            <Row className="mb-4">
                <Col>
                    <UserWelcome title="Admin Management" />
                </Col>
            </Row>

            {/* Quick Actions Section */}
            <Row className="mb-4">
                <Col>
                    <QuickActions actions={adminActions} title="Administrative Actions" />
                </Col>
            </Row>
        </Container>
    );
};

export default AdminDashboard;
