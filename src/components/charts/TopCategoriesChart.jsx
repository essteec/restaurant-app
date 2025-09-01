import React from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';

ChartJS.register(ArcElement, Tooltip, Legend);

const TopCategoriesChart = ({ data = [], title = "Top Performing Categories", loading = false }) => {
    // Sort by revenue and take top 8 categories
    const sortedData = [...data]
        .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue))
        .slice(0, 8);

    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)'
    ];

    const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 205, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)'
    ];

    const chartData = {
        labels: sortedData.map(category => category.categoryName),
        datasets: [
            {
                label: 'Revenue',
                data: sortedData.map(category => parseFloat(category.totalRevenue)),
                backgroundColor: colors.slice(0, sortedData.length),
                borderColor: borderColors.slice(0, sortedData.length),
                borderWidth: 2,
                hoverOffset: 4
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    generateLabels: function(chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const meta = chart.getDatasetMeta(0);
                                const style = meta.controller.getStyle(i);
                                const value = data.datasets[0].data[i];
                                const percentage = ((value / data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: style.backgroundColor,
                                    strokeStyle: style.borderColor,
                                    lineWidth: style.borderWidth,
                                    pointStyle: 'circle',
                                    hidden: isNaN(value) || meta.data[i].hidden,
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                cornerRadius: 8,
                callbacks: {
                    label: function(context) {
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return [
                            `${context.label}`,
                            `Revenue: $${value.toFixed(2)}`,
                            `Percentage: ${percentage}%`
                        ];
                    }
                }
            }
        }
    };

    return (
        <Card className="h-100">
            <Card.Header className="bg-warning text-dark">
                <h5 className="mb-0">
                    <i className="bi bi-pie-chart me-2"></i>
                    {title}
                </h5>
            </Card.Header>
            <Card.Body>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="spinner-border text-warning" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : sortedData.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="text-muted">
                            <i className="bi bi-info-circle me-2"></i>
                            No category data available for the selected period
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '300px', position: 'relative' }}>
                        <Doughnut data={chartData} options={options} />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default TopCategoriesChart;
