import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { getQrCodeUrl } from '../../../utils/helpers';

const AdminTableQRCodesPage = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creatingQR, setRegeneratingQR] = useState(false);
    const [deletingQR, setDeletingQR] = useState(false);

    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchQrCodes();
    }, [isAuthenticated, user]);

    const fetchQrCodes = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/tables/qr-codes');
            setQrCodes(response.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch QR codes.');
            showError(err.response?.data?.message || 'Failed to fetch QR codes');
            console.error('Fetch QR codes error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAllQRCodes = async () => {
        const confirmed = await confirm({
            title: 'Regenerate All QR Codes',
            message: 'Are you sure you want to regenerate all QR codes? This will overwrite existing QR code files.',
            confirmText: 'Regenerate All',
            confirmVariant: 'warning'
        });

        if (confirmed) {
            try {
                setRegeneratingQR(true);
                await apiClient.post('/tables/qr-codes');
                showSuccess('All QR codes have been regenerated successfully');
                await fetchQrCodes(); // Refresh the list
            } catch (err) {
                showError(err.response?.data?.message || 'Failed to regenerate QR codes');
                console.error('Regenerate QR codes error:', err);
            } finally {
                setRegeneratingQR(false);
            }
        }
    };

    const handleDeleteAllQRCodes = async () => {
        const confirmed = await confirm({
            title: 'Delete All QR Codes',
            message: 'Are you sure you want to delete all QR code image files? This cannot be undone.',
            confirmText: 'Delete All',
            confirmVariant: 'danger'
        });

        if (!confirmed) return;

        try {
            setDeletingQR(true);
            await apiClient.delete('/tables/qr-codes');
            showSuccess('All QR codes deleted successfully');
            await fetchQrCodes();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to delete QR codes');
            console.error('Delete QR codes error:', err);
        } finally {
            setDeletingQR(false);
        }
    };

    const handleDownload = async (qrCodeFileName, tableNumber) => {
        if (!qrCodeFileName) {
            showWarning('No QR code available for this table');
            return;
        }

        try {
            // GET as blob using apiClient so auth headers are included
            const response = await apiClient.get(`${getQrCodeUrl(qrCodeFileName)}`, {
            responseType: 'blob'
            });

            // Try derive filename from content-disposition header if present
            const contentDisposition = response.headers?.['content-disposition'] || response.headers?.['Content-Disposition'];
            let filename = `table_${tableNumber}_qr.jpg`;
            if (contentDisposition) {
            const match = /filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/.exec(contentDisposition);
            if (match) filename = decodeURIComponent(match[1] || match[2]);
            }

            const blob = new Blob([response.data], { type: response.data.type || 'image/jpeg' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            showSuccess(`QR code for table ${tableNumber} downloaded`);
        } catch (err) {
            console.error('Download QR code error:', err);
            // Provide helpful toast based on likely causes
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            showError('Unauthorized to download image. The server requires authentication.');
            } else if (err.message && err.message.includes('Network Error')) {
            showError('Network error while downloading. Check server CORS or connectivity.');
            } else {
            showError(err.response?.data?.message || 'Failed to download QR code');
            }
        }
    };

    const handlePrint = (qrCodeFileName, tableNumber) => {
        if (!qrCodeFileName) {
            showWarning('No QR code available for this table');
            return;
        }

        const imageUrl = getQrCodeUrl(qrCodeFileName);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - Table ${tableNumber}</title>
                    <style>
                        html, body {
                            height: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        body {
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: #fff;
                        }
                        .qr-image {
                            width: 100vw;
                            height: 100vh;
                            object-fit: contain;
                            max-width: 100vw;
                            max-height: 100vh;
                            display: block;
                            margin: 0 auto;
                            border: none;
                        }
                        @media print {
                            html, body {
                                height: 100%;
                                margin: 0;
                                padding: 0;
                            }
                            body {
                                background: #fff;
                            }
                            .qr-image {
                                width: 100vw;
                                height: 100vh;
                                max-width: 100vw;
                                max-height: 100vh;
                                object-fit: contain;
                                border: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <img src="${imageUrl}" alt="QR code for table ${tableNumber}" class="qr-image" />
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    };

    const handleViewFullSize = (qrCodeFileName, tableNumber) => {
        if (!qrCodeFileName) {
            showWarning('No QR code available for this table');
            return;
        }

        const imageUrl = getQrCodeUrl(qrCodeFileName);
        const viewWindow = window.open('', '_blank');
        viewWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - Table ${tableNumber}</title>
                    <style>
                        body { 
                            display: flex; 
                            justify-content: center; 
                            align-items: center; 
                            height: 100vh; 
                            margin: 0; 
                            background-color: #f5f5f5;
                        }
                        img { 
                            max-width: 90%; 
                            max-height: 90%; 
                            border: 2px solid #333;
                            background-color: white;
                        }
                    </style>
                </head>
                <body>
                    <img src="${imageUrl}" alt="QR code for table ${tableNumber}" />
                </body>
            </html>
        `);
        viewWindow.document.close();
    };

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading QR codes...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={() => navigate('/admin/tables')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Tables
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1>Table QR Codes</h1>
                    <p className="text-muted">Download, print, or view QR codes for all tables</p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="warning" 
                        onClick={handleCreateAllQRCodes}
                        disabled={creatingQR}
                    >
                        {creatingQR ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-repeat me-2"></i>
                                Create Missing QR Codes
                            </>
                        )}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteAllQRCodes}
                        disabled={deletingQR}
                    >
                        {deletingQR ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash me-2"></i>
                                Delete All QR Codes
                            </>
                        )}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/admin/tables')}>
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Tables
                    </Button>
                </div>
            </div>

            {qrCodes.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            No QR codes found. Try creating missing QR codes.
                        </Alert>
                        <Button 
                            variant="primary" 
                            onClick={handleCreateAllQRCodes}
                            disabled={creatingQR}
                        >
                            Generate QR Codes
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {qrCodes.map((table) => (
                        <Col md={6} lg={4} xl={3} className="mb-4" key={table.tableNumber}>
                            <Card className="h-100">
                                <Card.Header className="text-center bg-primary text-white">
                                    <h5 className="mb-0">Table {table.tableNumber}</h5>
                                </Card.Header>
                                <Card.Body className="text-center">
                                    {table.qrCode ? (
                                        <>
                                            <div className="mb-3">
                                                <img
                                                    src={getQrCodeUrl(table.qrCode)}
                                                    alt={`QR code for table ${table.tableNumber}`}
                                                    style={{ 
                                                        width: '150px', 
                                                        height: '150px',
                                                        border: '1px solid #ddd',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => handleViewFullSize(table.qrCode, table.tableNumber)}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <Alert variant="warning" style={{ display: 'none' }} className="mt-2">
                                                    <small>Image not available</small>
                                                </Alert>
                                            </div>
                                            <small className="text-muted d-block mb-3">
                                                Click image to view full size
                                            </small>
                                        </>
                                    ) : (
                                        <Alert variant="warning" className="mb-3">
                                            <small>No QR code available</small>
                                        </Alert>
                                    )}
                                </Card.Body>
                                <Card.Footer>
                                    <div className="d-grid gap-1">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleDownload(table.qrCode, table.tableNumber)}
                                            disabled={!table.qrCode}
                                        >
                                            <i className="bi bi-download me-1"></i>
                                            Download
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => handlePrint(table.qrCode, table.tableNumber)}
                                            disabled={!table.qrCode}
                                        >
                                            <i className="bi bi-printer me-1"></i>
                                            Print
                                        </Button>
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => handleViewFullSize(table.qrCode, table.tableNumber)}
                                            disabled={!table.qrCode}
                                        >
                                            <i className="bi bi-eye me-1"></i>
                                            View Full Size
                                        </Button>
                                    </div>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default AdminTableQRCodesPage;
