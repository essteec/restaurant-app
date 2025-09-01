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

const TopItemsChart = ({ data = [], title = "Top Performing Items", loading = false }) => {
    // Take top 10 items and sort by quantity sold
    const sortedData = [...data]
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 10);

    const chartData = {
        labels: sortedData.map(item => item.foodName),
        datasets: [
            {
                label: 'Quantity Sold',
                data: sortedData.map(item => item.quantitySold),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)',
                    'rgba(255, 99, 255, 0.8)',
                    'rgba(99, 255, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(255, 99, 255, 1)',
                    'rgba(99, 255, 132, 1)'
                ],
                borderWidth: 2,
                borderRadius: 4,
                borderSkipped: false
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
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
                        const item = sortedData[context.dataIndex];
                        return [
                            `Quantity Sold: ${context.parsed.y}`,
                            `Total Revenue: $${parseFloat(item.totalRevenue).toFixed(2)}`
                        ];
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Food Items',
                    font: {
                        weight: 'bold'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: {
                display: true,
                title: {
                    display: true,
                    text: 'Quantity Sold',
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
            }
        }
    };

    return (
        <Card className="h-100">
            <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                    <i className="bi bi-trophy me-2"></i>
                    {title}
                </h5>
            </Card.Header>
            <Card.Body>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="spinner-border text-success" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : sortedData.length === 0 ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                        <div className="text-muted">
                            <i className="bi bi-info-circle me-2"></i>
                            No item data available for the selected period
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

export default TopItemsChart;
