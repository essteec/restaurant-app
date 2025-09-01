import React from 'react';
import { Card } from 'react-bootstrap';

const RevenueHeatmap = ({ data = [], title = "Revenue Heatmap", loading = false }) => {
  if (loading) {
    return (
      <Card className="h-100">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">
            <i className="bi bi-grid-3x3-gap me-2"></i>
            {title}
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card className="h-100">
        <Card.Header className="bg-secondary text-white">
          <h5 className="mb-0">
            <i className="bi bi-grid-3x3-gap me-2"></i>
            {title}
          </h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-muted">
              <i className="bi bi-info-circle me-2"></i>
              No heatmap data available for the selected period
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Process data to create a heatmap grid
  const processHeatmapData = () => {
    // Backend returns days in uppercase, so we need to handle both formats
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Create a map for quick lookup
    const dataMap = new Map();
    data.forEach(point => {
      // Use the day name as it comes from the backend (uppercase)
      const key = `${point.dayOfWeek}-${point.hourOfDay}`;
      dataMap.set(key, parseFloat(point.revenue));
    });

    // Find min and max revenue for color scaling
    const revenues = data.map(point => parseFloat(point.revenue));
    const minRevenue = Math.min(...revenues);
    const maxRevenue = Math.max(...revenues);

    // Debug logging to help troubleshoot
    console.log('Heatmap Debug Info:', {
      dataLength: data.length,
      sampleData: data.slice(0, 3),
      mapSize: dataMap.size,
      sampleKeys: Array.from(dataMap.keys()).slice(0, 5),
      minRevenue,
      maxRevenue
    });

    return { days, dayLabels, hours, dataMap, minRevenue, maxRevenue };
  };

  const { days, dayLabels, hours, dataMap, minRevenue, maxRevenue } = processHeatmapData();

  const getIntensity = (revenue) => {
    if (maxRevenue === minRevenue) return 0.5;
    return (revenue - minRevenue) / (maxRevenue - minRevenue);
  };

  const getColor = (revenue) => {
    if (revenue === 0) return 'rgba(240, 240, 240, 1)';
    const intensity = getIntensity(revenue);
    // Use a blue to red gradient
    const red = Math.round(255 * intensity);
    const blue = Math.round(255 * (1 - intensity));
    return `rgba(${red}, 100, ${blue}, 0.8)`;
  };

  return (
    <Card className="h-100">
      <Card.Header className="bg-secondary text-white">
        <h5 className="mb-0">
          <i className="bi bi-grid-3x3-gap me-2"></i>
          {title} - Peak Hours Analysis
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3 d-flex justify-content-between align-items-center">
          <small className="text-muted">Revenue intensity by day and hour</small>
          <div className="d-flex align-items-center">
            <small className="text-muted me-2">Low</small>
            <div style={{
              width: '100px',
              height: '10px',
              background: 'linear-gradient(to right, rgba(100, 100, 255, 0.8), rgba(255, 100, 100, 0.8))',
              borderRadius: '5px'
            }}></div>
            <small className="text-muted ms-2">High</small>
          </div>
        </div>
        
        <div className="table-responsive">
          <table className="table table-bordered table-sm heatmap-table">
            <thead>
              <tr>
                <th className="text-center" style={{ minWidth: '80px' }}>Day / Hour</th>
                {Array.from({ length: 24 }, (_, hour) => (
                  <th key={hour} className="text-center" style={{ minWidth: '35px', fontSize: '0.75rem' }}>
                    {hour.toString().padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIndex) => (
                <tr key={day}>
                  <td className="fw-bold text-center" style={{ fontSize: '0.8rem' }}>
                    {dayLabels[dayIndex]}
                  </td>
                  {hours.map(hour => {
                    const key = `${day}-${hour}`;
                    const revenue = dataMap.get(key) || 0;
                    const color = getColor(revenue);
                    
                    return (
                      <td
                        key={hour}
                        className="text-center p-1 heatmap-cell"
                        style={{
                          backgroundColor: color,
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          minWidth: '35px',
                          height: '35px',
                          border: '1px solid #dee2e6'
                        }}
                        title={`${dayLabels[dayIndex]} ${hour}:00 - $${revenue.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`}
                      >
                        {/* {revenue > 0 && (
                          <span style={{ 
                            color: getIntensity(revenue) > 0.5 ? 'white' : 'black',
                            fontWeight: 'bold'
                          }}>
                            ${Math.round(revenue)}
                          </span>
                        )} */}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="text-center mt-3">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Hover over cells to see exact revenue values. Empty cells indicate no sales.
          </small>
        </div>
      </Card.Body>
      
      <style jsx>{`
        .heatmap-cell:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
          z-index: 10;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        }
        
        .heatmap-table {
          font-size: 0.8rem;
        }
        
        .heatmap-table th,
        .heatmap-table td {
          padding: 0.25rem;
          text-align: center;
          vertical-align: middle;
        }
      `}</style>
    </Card>
  );
};

export default RevenueHeatmap;
