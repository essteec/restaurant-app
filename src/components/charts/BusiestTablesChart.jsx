import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const BusiestTablesChart = ({ data = [], title = "Busiest Tables", loading = false }) => {
    // Sort by order count and take top 10 tables
    const sortedData = [...data]
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10);

    const chartData = {
        labels: sortedData.map(table => `Table ${table.tableNumber}`),
        datasets: [
            {
                label: 'Order Count',
                data: sortedData.map(table => table.orderCount),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // This creates a horizontal bar chart
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20
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
                        return `Orders: ${context.parsed.x}`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Number of Orders',
                    font: {
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Tables',
                    font: {
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        }
    };

    return (
        <Card className="h-100">
            <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                    <i className="bi bi-table me-2"></i>
                    {title}
                </h5>
            </Card.Header>
            <Card.Body>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="spinner-border text-info" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : sortedData.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="text-muted">
                            <i className="bi bi-info-circle me-2"></i>
                            No table data available for the selected period
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '300px', position: 'relative' }}>
                        <Bar data={chartData} options={options} />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default BusiestTablesChart;
