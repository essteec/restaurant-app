import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Badge, ListGroup, Pagination as BSPagination, Image } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { PAGINATION } from '../../../utils/constants';
import { getImageUrl } from '../../../utils/helpers';

const AdminFoodItemsPage = () => {
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null); // For add/edit form
    const [selectedItemContent, setSelectedItemContent] = useState(null); // For view modal (with categories)
    const [isEditing, setIsEditing] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [categoriesForItem, setCategoriesForItem] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    // Pagination state
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGINATION.DEFAULT_PAGE_SIZE,
        totalElements: 0,
        totalPages: 0
    });

    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchFoodItems();
    }, [isAuthenticated, user, pagination.page, pagination.size]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (imageFile) {
                URL.revokeObjectURL(URL.createObjectURL(imageFile));
            }
        };
    }, [imageFile]);

    // Fetch all food items (paginated or full list depending on backend response)
    const fetchFoodItems = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: 'foodName,asc'
            });
            const response = await apiClient.get(`/food-items?${params}`);
            // Backend may return PageFoodItemDto { content: [...] }
            const data = response.data;
            const items = Array.isArray(data)
                ? data
                : (data.content || []);
            // Sort alphabetically for consistency
            items.sort((a, b) => a.foodName.localeCompare(b.foodName));

            // Handle empty page
            if (items.length === 0 && pagination.page > 0) {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                return;
            }
            setFoodItems(items);
            // Update pagination totals
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements ?? items.length,
                totalPages: data.totalPages || 1
            }));
            setError(null);
        } catch (err) {
            setError('Failed to fetch food items. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch food items');
            console.error('Fetch food items error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch single item details (name-based)
    const fetchFoodItemByName = async (foodName) => {
        try {
            const response = await apiClient.get(`/food-items/${encodeURIComponent(foodName)}`);
            return response.data;
        } catch (err) {
            showError('Failed to fetch food item details');
            console.error('Fetch food item by name error:', err);
            return null;
        }
    };

    // Fetch categories for an item
    const fetchCategoriesForItem = async (foodName) => {
        try {
            const response = await apiClient.get(`/food-items/${encodeURIComponent(foodName)}/categories`);
            const cats = Array.isArray(response.data) ? response.data : (response.data?.content || []);
            setCategoriesForItem(cats);
        } catch (err) {
            console.error('Fetch categories error:', err);
            setCategoriesForItem([]);
        }
    };

    // Handlers adapted from menu version
    const handleAddFoodItemClick = () => {
        setCurrentItem({ foodName: '', description: '', price: '' });
        setIsEditing(false);
        setImageFile(null);
        setShowItemModal(true);
    };

    const handleEditFoodItemClick = (item) => {
        setCurrentItem({
            ...item,
            originalFoodName: item.foodName,
            price: item.price?.toString() ?? ''
        });
        setIsEditing(true);
        setImageFile(null);
        setShowItemModal(true);
    };

    const handleCloseModal = () => {
        // Clean up object URL if exists
        if (imageFile) {
            URL.revokeObjectURL(URL.createObjectURL(imageFile));
        }
        setShowItemModal(false);
        setCurrentItem(null);
        setIsEditing(false);
        setImageFile(null);
    };

    const handleViewFoodItemClick = async (item) => {
        setLoadingDetails(true);
        const itemDetails = await fetchFoodItemByName(item.foodName);
        if (itemDetails) {
            setSelectedItemContent(itemDetails);
            await fetchCategoriesForItem(item.foodName);
            setShowContentModal(true);
        }
        setLoadingDetails(false);
    };

    const handleDeleteFoodItem = async (item) => {
        const confirmed = await confirm({
            title: 'Delete Food Item',
            message: `Are you sure you want to delete food item "${item.foodName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });
        if (confirmed) {
            try {
                await apiClient.delete(`/food-items/${encodeURIComponent(item.foodName)}`);
                showSuccess('Food item deleted successfully');
                fetchFoodItems();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete food item';
                showError(errorMessage);
                console.error('Delete food item error:', err);
            }
        }
    };

    const validateFoodItem = (item) => {
        if (!item.foodName?.trim()) {
            showError('Food name is required');
            return false;
        }
        if (item.price === '' || item.price === null || isNaN(parseFloat(item.price))) {
            showError('Valid price is required');
            return false;
        }
        if (parseFloat(item.price) < 0) {
            showError('Price must be a positive number');
            return false;
        }
        return true;
    };

    const uploadImageIfPresent = async (foodName) => {
        if (!imageFile) return;
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            await apiClient.post(`/food-items/${encodeURIComponent(foodName)}/image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Image uploaded successfully');
        } catch (err) {
            showWarning(err.response?.data?.message || 'Food item saved, but image upload failed');
            console.error('Image upload error:', err);
        }
    };

    const handleDeleteImage = async (foodName) => {
        const confirmed = await confirm({
            title: 'Delete Image',
            message: 'Are you sure you want to delete this image?',
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;
        try {
            await apiClient.delete(`/food-items/${encodeURIComponent(foodName)}/image`);
            showSuccess('Image deleted');
            // Refresh detail view
            if (selectedItemContent && selectedItemContent.foodName === foodName) {
                const updated = await fetchFoodItemByName(foodName);
                setSelectedItemContent(updated);
            }
            fetchFoodItems();
        } catch (err) {
            showError(err.response?.data?.message || 'Failed to delete image');
            console.error('Delete image error:', err);
        }
    };

    const handleSaveFoodItem = async (e) => {
        e.preventDefault();
        if (!validateFoodItem(currentItem)) return;
        try {
            const payload = {
                foodName: currentItem.foodName.trim(),
                description: currentItem.description?.trim() || '',
                price: parseFloat(currentItem.price)
            };
            if (isEditing) {
                const originalFoodName = currentItem.originalFoodName || currentItem.foodName;
                await apiClient.put(`/food-items/${encodeURIComponent(originalFoodName)}`, payload);
                showSuccess('Food item updated successfully');
                // If name changed, use new name for image upload
                await uploadImageIfPresent(payload.foodName);
            } else {
                await apiClient.post('/food-items', payload);
                showSuccess('Food item created successfully');
                await uploadImageIfPresent(payload.foodName);
            }
            fetchFoodItems();
            handleCloseModal();
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} food item`;
            showError(errorMessage);
            console.error('Save food item error:', err);
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };
    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, page: 0, size: newSize }));
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'image',
            header: 'Image',
            accessor: 'image',
            className: 'text-center',
            render: (value) => value ? (
                    <Image
                        src={getImageUrl(value)}
                        alt="Food item"
                        rounded
                        style={{ width: '48px', height: '48px', objectFit: 'cover',
                            transition: 'transform 0.2s ease-in-out', cursor: 'pointer' }}
                        className="hover-zoom"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(3)';
                            e.target.style.transformOrigin = 'left center';
                            e.target.style.zIndex = '1000';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.transformOrigin = 'left center';
                            e.target.style.zIndex = 'auto';
                        }}
                    />
            ) : (
                <Badge bg="secondary">No</Badge>
            )
        },
        { 
            key: 'foodName', 
            header: 'Name', 
            accessor: 'foodName',
            render: (value) => <strong>{value}</strong>
        },
        { 
            key: 'description', 
            header: 'Description', 
            accessor: 'description',
            render: (value) => value || '—'
        },
        { 
            key: 'price', 
            header: 'Price', 
            accessor: 'price',
            className: 'text-center',
            render: (value) => <Badge bg="primary">${(value ?? 0).toFixed(2)}</Badge>
        },
        { 
            key: 'categories', 
            header: 'Category', 
            accessor: 'categories',
            className: 'text-center',  // lets display first category and a badge for count
            render: (value) => (
                <>
                    <Badge bg="light" text='dark'>{Array.isArray(value) && value.length > 0 ? value[0]['categoryName'] : 'No Category'}</Badge>
                    <Badge bg="secondary" className="ms-1">{Array.isArray(value) ? value.length : 0}</Badge>
                </>
            )
        },
        { 
            key: 'actions', 
            header: 'Actions', 
            accessor: 'foodName',
            sortable: false,
            render: (value, item) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewFoodItemClick(item); }}
                    >View</Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditFoodItemClick(item); }}
                    >Edit</Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteFoodItem(item); }}
                    >Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading food items...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Food Item Management</h1>
                <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleAddFoodItemClick}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Food Item
                    </Button>
                </div>
            </div>

            {foodItems.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No food items found. Create your first food item to get started.</p>
                        <Button variant="primary" onClick={handleAddFoodItemClick}>
                            Create First Food Item
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={foodItems}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No food items found"
                />
            )}

            {/* Custom Backend Pagination Controls */}
            {foodItems.length > 0 && (
                <Card className="mt-3">
                    <Card.Body>
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <Form.Label className="mb-0">Page Size:</Form.Label>
                                <Form.Select
                                    size="sm"
                                    style={{ width: 'auto' }}
                                    value={pagination.size}
                                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                >
                                    {PAGINATION.PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </div>
                            <BSPagination className="mb-0">
                                <BSPagination.First disabled={pagination.page === 0} onClick={() => handlePageChange(0)} />
                                <BSPagination.Prev disabled={pagination.page === 0} onClick={() => handlePageChange(pagination.page - 1)} />
                                {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i)
                                    .slice(Math.max(0, pagination.page - 2), Math.min(pagination.totalPages, pagination.page + 3))
                                    .map(p => (
                                        <BSPagination.Item
                                            key={p}
                                            active={p === pagination.page}
                                            onClick={() => handlePageChange(p)}
                                        >{p + 1}</BSPagination.Item>
                                    ))
                                }
                                <BSPagination.Next disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.page + 1)} />
                                <BSPagination.Last disabled={pagination.page >= pagination.totalPages - 1} onClick={() => handlePageChange(pagination.totalPages - 1)} />
                            </BSPagination>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Add/Edit Food Item Modal */}
            <Modal show={showItemModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Food Item' : 'Add New Food Item'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveFoodItem}>
                    <Modal.Body>
                        {currentItem && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Food Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentItem.foodName}
                                        onChange={(e) => setCurrentItem({ ...currentItem, foodName: e.target.value })}
                                        required
                                        placeholder="Enter food name"
                                    />
                                    {isEditing && (
                                        <Form.Text className="text-muted">
                                            Changing the food name will update the identifier
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={currentItem.description}
                                        onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                                        placeholder="Enter description (optional)"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Price *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={currentItem.price}
                                        onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
                                        required
                                        placeholder="Enter price"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Image (*Max 5MB)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    />
                                    <Form.Text className="text-muted">You can upload or replace the image when saving.</Form.Text>
                                    {/* Show current image preview if editing and has image */}
                                    {isEditing && currentItem.image && (
                                        <div className="mt-2">
                                            <Form.Text className="text-muted d-block mb-2">Current image:</Form.Text>
                                            <Image 
                                                src={getImageUrl(currentItem.image)} 
                                                alt="Current food item" 
                                                thumbnail 
                                                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                            <Badge bg="secondary" style={{ display: 'none' }}>
                                                Image not available
                                            </Badge>
                                        </div>
                                    )}
                                    {/* Show preview of selected new image */}
                                    {imageFile && (
                                        <div className="mt-2">
                                            <Form.Text className="text-muted d-block mb-2">New image preview:</Form.Text>
                                            <Image 
                                                src={URL.createObjectURL(imageFile)} 
                                                alt="New image preview" 
                                                thumbnail 
                                                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                                            />
                                        </div>
                                    )}
                                </Form.Group>
                                {!isEditing && (
                                    <Alert variant="info">
                                        <small>
                                            <strong>Note:</strong> After creating the food item you can assign it to menus & categories elsewhere.
                                        </small>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                        <Button variant="primary" type="submit">{isEditing ? 'Update Food Item' : 'Create Food Item'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Food Item Detail Modal */}
            <Modal show={showContentModal} onHide={() => setShowContentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Food Item: {selectedItemContent?.foodName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingDetails && (
                        <div className="text-center mb-3">
                            <Spinner animation="border" size="sm" /> Loading details...
                        </div>
                    )}
                    {selectedItemContent && !loadingDetails && (
                        <>
                            {(selectedItemContent.description || selectedItemContent.price != null) && (
                                <Alert variant="light" className="mb-3">
                                    <div><strong>Description:</strong> {selectedItemContent.description || '—'}</div>
                                    <div className="mt-2"><strong>Price:</strong> ${(selectedItemContent.price ?? 0).toFixed(2)}</div>
                                </Alert>
                            )}
                            <h5 className="mt-3">Categories ({categoriesForItem.length})</h5>
                            {categoriesForItem.length > 0 ? (
                                <ListGroup className="mb-3">
                                    {categoriesForItem.map((cat, idx) => (
                                        <ListGroup.Item key={idx}>{cat.categoryName || cat.name || JSON.stringify(cat)}</ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <Alert variant="warning" className="mb-3">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    This food item has no categories.
                                </Alert>
                            )}
                            <h5>Image</h5>
                            {selectedItemContent.image ? (
                                <div className="mb-3">
                                    <div className="mb-3">
                                        <Image 
                                            src={getImageUrl(selectedItemContent.image)} 
                                            alt={selectedItemContent.foodName} 
                                            fluid 
                                            rounded
                                            style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                            }}
                                        />
                                        <Alert variant="warning" style={{ display: 'none' }} className="mt-2">
                                            <i className="bi bi-exclamation-triangle me-2"></i>
                                            Image could not be loaded: {selectedItemContent.image}
                                        </Alert>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg="secondary">{selectedItemContent.image}</Badge>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => handleDeleteImage(selectedItemContent.foodName)}
                                        >Delete Image</Button>
                                    </div>
                                </div>
                            ) : (
                                <Alert variant="secondary" className="mb-0">No image uploaded.</Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContentModal(false)}>Close</Button>
                    {selectedItemContent && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowContentModal(false);
                                handleEditFoodItemClick(selectedItemContent);
                            }}
                        >Edit Food Item</Button>
                    )}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminFoodItemsPage;
