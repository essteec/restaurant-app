import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const DashboardStats = ({ stats = {}, loading = false }) => {
    const statsData = [
        {
            title: 'Total Revenue',
            value: stats.totalRevenue || '0.00',
            icon: 'bi bi-cash',
            color: 'success',
            prefix: '$',
            suffix: '',
            description: 'Total revenue generated'
        },
        {
            title: 'Total Orders',
            value: stats.totalOrders || '0',
            icon: 'bi bi-receipt',
            color: 'primary',
            prefix: '',
            suffix: '',
            description: 'Number of orders placed'
        },
        {
            title: 'Average Order Value',
            value: stats.averageOrderValue || '0.00',
            icon: 'bi bi-graph-up',
            color: 'info',
            prefix: '$',
            suffix: '',
            description: 'Average value per order'
        },
        {
            title: 'New Customers',
            value: stats.newCustomers || '0',
            icon: 'bi bi-person-plus',
            color: 'warning',
            prefix: '',
            suffix: '',
            description: 'New customers acquired'
        }
    ];

    const formatValue = (value, prefix, suffix) => {
        if (typeof value === 'number') {
            return `${prefix}${value.toLocaleString('en-US', {
                minimumFractionDigits: prefix === '$' ? 2 : 0,
                maximumFractionDigits: prefix === '$' ? 2 : 0
            })}${suffix}`;
        }
        return `${prefix}${value}${suffix}`;
    };

    return (
        <Row className="g-3 mb-4">
            {statsData.map((stat, index) => (
                <Col key={index} xs={12} sm={6} lg={3}>
                    <Card className={`h-100 border-${stat.color} shadow-sm`}>
                        <Card.Body className="d-flex flex-column">
                            {loading ? (
                                <div className="text-center py-3">
                                    <div className="spinner-border spinner-border-sm text-muted" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div className="flex-grow-1">
                                            <h6 className="text-muted mb-1 small">{stat.title}</h6>
                                            <h4 className={`text-${stat.color} mb-0 fw-bold`}>
                                                {formatValue(stat.value, stat.prefix, stat.suffix)}
                                            </h4>
                                        </div>
                                        <div className={`text-${stat.color} ms-2`}>
                                            <i className={`${stat.icon} fs-4`}></i>
                                        </div>
                                    </div>
                                    <small className="text-muted mt-auto">{stat.description}</small>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default DashboardStats;
