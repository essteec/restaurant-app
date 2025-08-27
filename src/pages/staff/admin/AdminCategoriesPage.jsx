import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Row, Col, Badge, ListGroup, Pagination as BSPagination } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';
import { PAGINATION, AVAILABLE_LANGUAGES } from '../../../utils/constants';

const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showManageFoodItemsModal, setShowManageFoodItemsModal] = useState(false);
    const [showTranslationModal, setShowTranslationModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [selectedCategoryContent, setSelectedCategoryContent] = useState(null);
    const [selectedCategoryForFoodItems, setSelectedCategoryForFoodItems] = useState(null);
    const [selectedCategoryForTranslation, setSelectedCategoryForTranslation] = useState(null);
    const [translations, setTranslations] = useState([]);
    const [currentTranslation, setCurrentTranslation] = useState(null);
    const [isEditingTranslation, setIsEditingTranslation] = useState(false);
    const [loadingTranslations, setLoadingTranslations] = useState(false);
    const [availableFoodItems, setAvailableFoodItems] = useState([]);
    const [categoryFoodItems, setCategoryFoodItems] = useState([]);
    const [originalCategoryFoodItems, setOriginalCategoryFoodItems] = useState([]);
    const [pendingChanges, setPendingChanges] = useState({ toAdd: [], toRemove: [] });
    const [loadingFoodItems, setLoadingFoodItems] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        fetchCategories();
    }, [isAuthenticated, user, pagination.page, pagination.size]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: 'categoryName,asc'
            });
            const response = await apiClient.get(`/categories?${params}`);
            // Categories endpoint may return paginated data or array
            const data = response.data;
            const categoryData = Array.isArray(data)
                ? data
                : (data.content || []);
            // Sort alphabetically for consistency
            categoryData.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
            
            // Handle empty page
            if (categoryData.length === 0 && pagination.page > 0) {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                return;
            }
            
            setCategories(categoryData);
            // Update pagination totals
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements ?? categoryData.length,
                totalPages: data.totalPages || 1
            }));
            setError(null);
        } catch (err) {
            setError('Failed to fetch categories. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch categories');
            console.error('Fetch categories error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Pagination handlers
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };
    
    const handlePageSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, page: 0, size: newSize }));
    };

    const fetchCategoryByName = async (categoryName) => {
        try {
            // Get category details from the categories list and fetch its food items
            const category = categories.find(cat => cat.categoryName === categoryName);
            if (!category) return null;
            
            // The category already contains its food items from the GET /categories endpoint
            return category;
        } catch (err) {
            showError('Failed to fetch category details');
            console.error('Fetch category by name error:', err);
            return null;
        }
    };

    const fetchAllFoodItems = async () => {
        try {
            const response = await apiClient.get('/food-items');
            return response.data?.content || response.data || [];
        } catch (err) {
            showError('Failed to fetch food items');
            console.error('Fetch food items error:', err);
            return [];
        }
    };

    const addFoodItemsToCategory = async (categoryName, foodItemNames) => {
        try {
            const response = await apiClient.put(`/categories/${encodeURIComponent(categoryName)}/food-items`, {
                names: foodItemNames
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const removeFoodItemsFromCategory = async (categoryName, foodItemNames) => {
        try {
            const response = await apiClient.delete(`/categories/${encodeURIComponent(categoryName)}/food-items`, {
                data: { names: foodItemNames }
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    // Translation management functions
    const fetchTranslations = async (categoryName) => {
        try {
            setLoadingTranslations(true);
            const response = await apiClient.get(`/categories/${encodeURIComponent(categoryName)}/languages`);
            const translationData = Array.isArray(response.data) ? response.data : [];
            setTranslations(translationData);
        } catch (err) {
            showError('Failed to fetch translations');
            console.error('Fetch translations error:', err);
            setTranslations([]);
        } finally {
            setLoadingTranslations(false);
        }
    };

    const handleTranslationsClick = async (category) => {
        setSelectedCategoryForTranslation(category);
        await fetchTranslations(category.categoryName);
        setShowTranslationModal(true);
    };

    const handleAddTranslationClick = () => {
        setCurrentTranslation({
            languageCode: '',
            name: ''
        });
        setIsEditingTranslation(false);
    };

    const handleEditTranslationClick = (translation) => {
        setCurrentTranslation({ ...translation });
        setIsEditingTranslation(true);
    };

    const handleSaveTranslation = async (e) => {
        e.preventDefault();
        if (!currentTranslation?.languageCode || !currentTranslation?.name?.trim()) {
            showError('Language and translated name are required');
            return;
        }

        try {
            const payload = {
                languageCode: currentTranslation.languageCode,
                name: currentTranslation.name.trim()
            };

            if (isEditingTranslation) {
                await apiClient.put(
                    `/categories/${encodeURIComponent(selectedCategoryForTranslation.categoryName)}/languages/${currentTranslation.languageCode}`,
                    payload
                );
                showSuccess('Translation updated successfully');
            } else {
                await apiClient.post(
                    `/categories/${encodeURIComponent(selectedCategoryForTranslation.categoryName)}/languages`,
                    payload
                );
                showSuccess('Translation added successfully');
            }

            await fetchTranslations(selectedCategoryForTranslation.categoryName);
            setCurrentTranslation(null);
            setIsEditingTranslation(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${isEditingTranslation ? 'update' : 'add'} translation`;
            showError(errorMessage);
            console.error('Save translation error:', err);
        }
    };

    const handleDeleteTranslation = async (translation) => {
        const confirmed = await confirm({
            title: 'Delete Translation',
            message: `Are you sure you want to delete the ${translation.languageCode} translation?`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(
                    `/categories/${encodeURIComponent(selectedCategoryForTranslation.categoryName)}/languages/${translation.languageCode}`
                );
                showSuccess('Translation deleted successfully');
                await fetchTranslations(selectedCategoryForTranslation.categoryName);
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete translation';
                showError(errorMessage);
                console.error('Delete translation error:', err);
            }
        }
    };

    const getLanguageName = (langCode) => {
        const lang = AVAILABLE_LANGUAGES.find(l => l.code === langCode);
        return lang ? `${lang.flag} ${lang.name}` : langCode;
    };

    const getAvailableLanguages = () => {
        const existingLanguages = translations.map(t => t.languageCode);
        return AVAILABLE_LANGUAGES.filter(lang => !existingLanguages.includes(lang.code));
    };

    const handleAddCategoryClick = () => {
        setCurrentCategory({ categoryName: '' });
        setIsEditing(false);
        setShowCategoryModal(true);
    };

    const handleEditCategoryClick = (category) => {
        setCurrentCategory({
            ...category,
            originalCategoryName: category.categoryName // Store original name for API call
        });
        setIsEditing(true);
        setShowCategoryModal(true);
    };

    const handleViewCategoryClick = async (category) => {
        const categoryDetails = await fetchCategoryByName(category.categoryName);
        if (categoryDetails) {
            setSelectedCategoryContent(categoryDetails);
            setShowContentModal(true);
        }
    };

    const handleManageFoodItemsClick = async (category) => {
        try {
            setLoadingFoodItems(true);
            setSelectedCategoryForFoodItems(category);

            // Fetch all available food items 
            const allFoodItems = await fetchAllFoodItems();
            
            // Get current category food items (already included in category object)
            const currentCategoryFoodItems = category.foodItems || [];

            setAvailableFoodItems(allFoodItems);
            setCategoryFoodItems(currentCategoryFoodItems);
            setOriginalCategoryFoodItems(currentCategoryFoodItems);
            setPendingChanges({ toAdd: [], toRemove: [] });
            setShowManageFoodItemsModal(true);
        } catch (err) {
            showError('Failed to load food items data');
            console.error('Manage food items error:', err);
        } finally {
            setLoadingFoodItems(false);
        }
    };

    const handleAddFoodItemToCategory = (item) => {
        const newCategoryFoodItems = [...categoryFoodItems, item];
        setCategoryFoodItems(newCategoryFoodItems);

        // Update pending changes
        const newPendingChanges = { ...pendingChanges };

        // If this item was in the remove list, remove it from there
        newPendingChanges.toRemove = newPendingChanges.toRemove.filter(name => name !== item.foodName);

        // If this item wasn't in the original category, add it to the add list
        const wasInOriginal = originalCategoryFoodItems.find(original => original.foodName === item.foodName);
        if (!wasInOriginal && !newPendingChanges.toAdd.includes(item.foodName)) {
            newPendingChanges.toAdd.push(item.foodName);
        }

        setPendingChanges(newPendingChanges);
    };

    const handleRemoveFoodItemFromCategory = (item) => {
        const newCategoryFoodItems = categoryFoodItems.filter(categoryItem => categoryItem.foodName !== item.foodName);
        setCategoryFoodItems(newCategoryFoodItems);

        // Update pending changes
        const newPendingChanges = { ...pendingChanges };

        // If this item was in the add list, remove it from there
        newPendingChanges.toAdd = newPendingChanges.toAdd.filter(name => name !== item.foodName);

        // If this item was in the original category, add it to the remove list
        const wasInOriginal = originalCategoryFoodItems.find(original => original.foodName === item.foodName);
        if (wasInOriginal && !newPendingChanges.toRemove.includes(item.foodName)) {
            newPendingChanges.toRemove.push(item.foodName);
        }

        setPendingChanges(newPendingChanges);
    };

    const handleApplyFoodItemChanges = async () => {
        try {
            setLoadingFoodItems(true);

            const promises = [];

            // Add new food items
            if (pendingChanges.toAdd.length > 0) {
                promises.push(addFoodItemsToCategory(selectedCategoryForFoodItems.categoryName, pendingChanges.toAdd));
            }

            // Remove food items
            if (pendingChanges.toRemove.length > 0) {
                promises.push(removeFoodItemsFromCategory(selectedCategoryForFoodItems.categoryName, pendingChanges.toRemove));
            }

            if (promises.length > 0) {
                await Promise.all(promises);

                const addedCount = pendingChanges.toAdd.length;
                const removedCount = pendingChanges.toRemove.length;

                let message = '';
                if (addedCount > 0 && removedCount > 0) {
                    message = `Added ${addedCount} and removed ${removedCount} food items`;
                } else if (addedCount > 0) {
                    message = `Added ${addedCount} food item(s) to category`;
                } else if (removedCount > 0) {
                    message = `Removed ${removedCount} food item(s) from category`;
                }

                showSuccess(message);
                fetchCategories(); // Refresh the category list to show updated food item counts
            }

            setShowManageFoodItemsModal(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to apply food item changes';
            showError(errorMessage);
            console.error('Apply food item changes error:', err);
        } finally {
            setLoadingFoodItems(false);
        }
    };

    const handleCancelFoodItemChanges = () => {
        // Reset to original state
        setCategoryFoodItems(originalCategoryFoodItems);
        setPendingChanges({ toAdd: [], toRemove: [] });
        setShowManageFoodItemsModal(false);
    };

    const handleDeleteCategory = async (category) => {
        const confirmed = await confirm({
            title: 'Delete Category',
            message: `Are you sure you want to delete category "${category.categoryName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/categories/${encodeURIComponent(category.categoryName)}`);
                showSuccess('Category deleted successfully');
                fetchCategories();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete category';
                showError(errorMessage);
                console.error('Delete category error:', err);
            }
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();

        if (!currentCategory.categoryName.trim()) {
            showError('Category name is required');
            return;
        }

        try {
            const payload = {
                categoryName: currentCategory.categoryName.trim()
            };

            if (isEditing) {
                // Update existing category - use the original category name for the URL
                const originalCategoryName = currentCategory.originalCategoryName || currentCategory.categoryName;
                await apiClient.put(`/categories/${encodeURIComponent(originalCategoryName)}`, payload);
                showSuccess('Category updated successfully');
            } else {
                // Create new category
                await apiClient.post('/categories', payload);
                showSuccess('Category created successfully');
            }

            fetchCategories();
            setShowCategoryModal(false);
            setCurrentCategory(null);
            setIsEditing(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} category`;
            showError(errorMessage);
            console.error('Save category error:', err);
        }
    };

    // DataTable columns configuration
    const columns = [
        {
            key: 'categoryName',
            header: 'Category Name',
            accessor: 'categoryName',
            render: (value) => <strong>{value}</strong>
        },
        {
            key: 'foodItems',
            header: 'Food Items',
            accessor: 'foodItems',
            render: (value, category) => (
                <div className="d-flex align-items-center">
                    <Badge bg="info" style={{ minWidth: 70 }}>{value?.length || 0} items</Badge>
                    <div className="me-auto ms-auto">
                        <Button
                            style={{ height: '16px', width: '16px'}}
                            variant="outline-success"
                            title="Manage Food Items"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleManageFoodItemsClick(category);
                            }}
                        >
                        </Button>
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            accessor: 'categoryName',
            sortable: false,
            render: (value, category) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewCategoryClick(category); }}
                    >View</Button>
                    <Button
                        variant="outline-info"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleTranslationsClick(category); }}
                        title="Manage Translations"
                    >
                        <i className="bi bi-translate"></i>
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditCategoryClick(category); }}
                    >Edit</Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category); }}
                    >Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading categories...</p>
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
                <h1>Category Management</h1>
                <div className="d-flex gap-2">
                    <Button variant="primary" onClick={handleAddCategoryClick}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Category
                    </Button>
                </div>
            </div>

            {categories.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No categories found. Create your first category to get started.</p>
                        <Button variant="primary" onClick={handleAddCategoryClick}>
                            Create First Category
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={categories}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No categories found"
                />
            )}

            {/* Custom Backend Pagination Controls */}
            {categories.length > 0 && (
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

            {/* Add/Edit Category Modal */}
            <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Category' : 'Add New Category'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveCategory}>
                    <Modal.Body>
                        {currentCategory && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentCategory.categoryName}
                                        onChange={(e) => setCurrentCategory({ ...currentCategory, categoryName: e.target.value })}
                                        required
                                        placeholder="Enter category name (e.g., Appetizers, Main Courses, Desserts)"
                                    />
                                    {isEditing && (
                                        <Form.Text className="text-muted">
                                            Changing the category name will update the category identifier
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                {!isEditing && (
                                    <Alert variant="info">
                                        <small>
                                            <strong>Note:</strong> After creating the category, you can assign food items to it using the "Manage Food Items" button.
                                        </small>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update Category' : 'Create Category'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Category Content Modal */}
            <Modal show={showContentModal} onHide={() => setShowContentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Category Contents: {selectedCategoryContent?.categoryName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCategoryContent && (
                        <>
                            <h5>Food Items ({selectedCategoryContent.foodItems?.length || 0})</h5>
                            {selectedCategoryContent.foodItems && selectedCategoryContent.foodItems.length > 0 ? (
                                <ListGroup>
                                    {selectedCategoryContent.foodItems.map((item, index) => (
                                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{item.foodName}</strong>
                                                {item.description && (
                                                    <div className="text-muted small">{item.description}</div>
                                                )}
                                            </div>
                                            <div className="text-end">
                                                <Badge bg="primary" className="me-2">
                                                    ${item.price?.toFixed(2) || '0.00'}
                                                </Badge>
                                                {item.image && (
                                                    <Badge bg="secondary">
                                                        <i className="bi bi-image"></i>
                                                    </Badge>
                                                )}
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <Alert variant="warning">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    This category has no food items yet. Use the "Manage Food Items" button to assign food items to this category.
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContentModal(false)}>
                        Close
                    </Button>
                    {selectedCategoryContent && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowContentModal(false);
                                handleEditCategoryClick(selectedCategoryContent);
                            }}
                        >
                            Edit Category
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Manage Food Items Modal */}
            <Modal show={showManageFoodItemsModal} onHide={handleCancelFoodItemChanges} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Manage Food Items: {selectedCategoryForFoodItems?.categoryName}
                        {(pendingChanges.toAdd.length > 0 || pendingChanges.toRemove.length > 0) && (
                            <Badge bg="warning" className="ms-2">
                                {pendingChanges.toAdd.length + pendingChanges.toRemove.length} pending changes
                            </Badge>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingFoodItems ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading food items...</p>
                        </div>
                    ) : (
                        <Row>
                            <Col md={6}>
                                <h6>Available Food Items</h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <ListGroup>
                                        {availableFoodItems
                                            .filter(item => !categoryFoodItems.find(categoryItem => categoryItem.foodName === item.foodName))
                                            .map((item, index) => (
                                                <ListGroup.Item
                                                    key={index}
                                                    className="d-flex justify-content-between align-items-center"
                                                >
                                                    <div>
                                                        <strong>{item.foodName}</strong>
                                                        {item.description && (
                                                            <div className="text-muted small">{item.description}</div>
                                                        )}
                                                        <div className="mt-1">
                                                            <Badge bg="primary" className="me-1">
                                                                ${item.price?.toFixed(2) || '0.00'}
                                                            </Badge>
                                                            {item.image && (
                                                                <Badge bg="secondary" className="me-1">
                                                                    <i className="bi bi-image"></i>
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handleAddFoodItemToCategory(item)}
                                                    >
                                                        <i className="bi bi-plus"></i> Add
                                                    </Button>
                                                </ListGroup.Item>
                                            ))}
                                    </ListGroup>
                                    {availableFoodItems.filter(item => !categoryFoodItems.find(categoryItem => categoryItem.foodName === item.foodName)).length === 0 && (
                                        <Alert variant="info">All available food items are already in this category.</Alert>
                                    )}
                                </div>
                            </Col>
                            <Col md={6}>
                                <h6>Current Category Items ({categoryFoodItems.length})</h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <ListGroup>
                                        {categoryFoodItems.map((item, index) => {
                                            const wasInOriginal = originalCategoryFoodItems.find(original => original.foodName === item.foodName);
                                            const isNewlyAdded = !wasInOriginal;

                                            return (
                                                <ListGroup.Item
                                                    key={index}
                                                    className={`d-flex justify-content-between align-items-center ${isNewlyAdded ? 'bg-light border-success' : ''}`}
                                                >
                                                    <div>
                                                        <strong>{item.foodName}</strong>
                                                        {isNewlyAdded && (
                                                            <Badge bg="success" className="ms-2 small">NEW</Badge>
                                                        )}
                                                        {item.description && (
                                                            <div className="text-muted small">{item.description}</div>
                                                        )}
                                                        <div className="mt-1">
                                                            <Badge bg="primary" className="me-1">
                                                                ${item.price?.toFixed(2) || '0.00'}
                                                            </Badge>
                                                            {item.image && (
                                                                <Badge bg="secondary" className="me-1">
                                                                    <i className="bi bi-image"></i>
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleRemoveFoodItemFromCategory(item)}
                                                    >
                                                        <i className="bi bi-dash"></i> Remove
                                                    </Button>
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>
                                    {categoryFoodItems.length === 0 && (
                                        <Alert variant="warning">This category has no food items yet.</Alert>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    )}

                    {/* Pending Changes Summary */}
                    {(pendingChanges.toAdd.length > 0 || pendingChanges.toRemove.length > 0) && (
                        <Alert variant="info" className="mt-3">
                            <strong>Pending Changes:</strong>
                            {pendingChanges.toAdd.length > 0 && (
                                <div><i className="bi bi-plus-circle text-success"></i> Adding {pendingChanges.toAdd.length} item(s): {pendingChanges.toAdd.join(', ')}</div>
                            )}
                            {pendingChanges.toRemove.length > 0 && (
                                <div><i className="bi bi-dash-circle text-danger"></i> Removing {pendingChanges.toRemove.length} item(s): {pendingChanges.toRemove.join(', ')}</div>
                            )}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleCancelFoodItemChanges}
                        disabled={loadingFoodItems}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleApplyFoodItemChanges}
                        disabled={loadingFoodItems || (pendingChanges.toAdd.length === 0 && pendingChanges.toRemove.length === 0)}
                    >
                        {loadingFoodItems ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Applying...
                            </>
                        ) : (
                            <>Accept Changes ({pendingChanges.toAdd.length + pendingChanges.toRemove.length})</>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Translation Management Modal */}
            <Modal show={showTranslationModal} onHide={() => setShowTranslationModal(false)} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-translate me-2"></i>
                        Manage Translations: {selectedCategoryForTranslation?.categoryName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingTranslations && (
                        <div className="text-center mb-3">
                            <Spinner animation="border" size="sm" /> Loading translations...
                        </div>
                    )}
                    
                    {!loadingTranslations && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">Existing Translations ({translations.length})</h5>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddTranslationClick}
                                    disabled={getAvailableLanguages().length === 0}
                                >
                                    <i className="bi bi-plus-circle me-1"></i>
                                    Add Translation
                                </Button>
                            </div>

                            {getAvailableLanguages().length === 0 && (
                                <Alert variant="info" className="mb-3">
                                    <i className="bi bi-info-circle me-2"></i>
                                    All supported languages have been translated.
                                </Alert>
                            )}

                            {translations.length > 0 ? (
                                <ListGroup className="mb-4">
                                    {translations.map((translation, idx) => (
                                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="d-flex align-items-center mb-2">
                                                    <Badge bg="primary" className="me-2">
                                                        {getLanguageName(translation.languageCode)}
                                                    </Badge>
                                                </div>
                                                <div><strong>Name:</strong> {translation.name}</div>
                                            </div>
                                            <div className="d-flex gap-1">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => handleEditTranslationClick(translation)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteTranslation(translation)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <Alert variant="secondary" className="mb-4">
                                    <i className="bi bi-info-circle me-2"></i>
                                    No translations available. Add your first translation to get started.
                                </Alert>
                            )}

                            {/* Add/Edit Translation Form */}
                            {currentTranslation && (
                                <Card>
                                    <Card.Header>
                                        <h6 className="mb-0">
                                            {isEditingTranslation ? 'Edit Translation' : 'Add New Translation'}
                                        </h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form onSubmit={handleSaveTranslation}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Language *</Form.Label>
                                                {isEditingTranslation ? (
                                                    <Form.Control
                                                        type="text"
                                                        value={getLanguageName(currentTranslation.languageCode)}
                                                        disabled
                                                    />
                                                ) : (
                                                    <Form.Select
                                                        value={currentTranslation.languageCode}
                                                        onChange={(e) => setCurrentTranslation({
                                                            ...currentTranslation,
                                                            languageCode: e.target.value
                                                        })}
                                                        required
                                                    >
                                                        <option value="">Select a language...</option>
                                                        {getAvailableLanguages().map(lang => (
                                                            <option key={lang.code} value={lang.code}>
                                                                {lang.flag} {lang.name}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                )}
                                            </Form.Group>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Translated Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={currentTranslation.name}
                                                    onChange={(e) => setCurrentTranslation({
                                                        ...currentTranslation,
                                                        name: e.target.value
                                                    })}
                                                    required
                                                    placeholder="Enter translated category name"
                                                />
                                            </Form.Group>
                                            <div className="d-flex gap-2">
                                                <Button variant="primary" type="submit">
                                                    {isEditingTranslation ? 'Update Translation' : 'Add Translation'}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setCurrentTranslation(null);
                                                        setIsEditingTranslation(false);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTranslationModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default AdminCategoriesPage;
