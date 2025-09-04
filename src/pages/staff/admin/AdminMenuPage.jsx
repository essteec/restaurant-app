import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Spinner, Alert, Modal, Form, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { DataTable } from '../../../components';
import { useToast } from '../../../hooks/useToast.js';
import { useConfirmation } from '../../../hooks/useConfirmation.js';

const AdminMenuPage = () => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showManageFoodItemsModal, setShowManageFoodItemsModal] = useState(false);
    const [currentMenu, setCurrentMenu] = useState(null);
    const [selectedMenuContent, setSelectedMenuContent] = useState(null);
    const [selectedMenuForFoodItems, setSelectedMenuForFoodItems] = useState(null);
    const [availableFoodItems, setAvailableFoodItems] = useState([]);
    const [menuFoodItems, setMenuFoodItems] = useState([]);
    const [originalMenuFoodItems, setOriginalMenuFoodItems] = useState([]);
    const [pendingChanges, setPendingChanges] = useState({ toAdd: [], toRemove: [] });
    const [loadingFoodItems, setLoadingFoodItems] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedMenusForActive, setSelectedMenusForActive] = useState(new Set());
    
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showWarning } = useToast();
    const { confirm } = useConfirmation();

    useEffect(() => {
        if (!isAuthenticated || user?.role !== 'ADMIN') {
            setError('Access Denied: You do not have administrative privileges.');
            setLoading(false);
            return;
        }
        fetchMenus();
    }, [isAuthenticated, user]);

    const fetchMenus = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/menus');
            // Sort active menus first
            const sortedMenus = (response.data || []).slice().sort((a, b) => {
                if (a.active === b.active) return 0;
                return a.active ? -1 : 1;
            });
            setMenus(sortedMenus);
            
            // Initialize selected menus with currently active ones
            const activeMenuNames = sortedMenus.filter(menu => menu.active).map(menu => menu.menuName);
            setSelectedMenusForActive(new Set(activeMenuNames));
            
            setError(null);
        } catch (err) {
            setError('Failed to fetch menus. Please try again later.');
            showError(err.response?.data?.message || 'Failed to fetch menus');
            console.error('Fetch menus error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuByName = async (menuName) => {
        try {
            const response = await apiClient.get(`/menus/by-name?name=${encodeURIComponent(menuName)}`);
            return response.data;
        } catch (err) {
            showError('Failed to fetch menu details');
            console.error('Fetch menu by name error:', err);
            return null;
        }
    };

    const fetchAllFoodItems = async () => {
        try {
            const response = await apiClient.get('/food-items?size=1000');
            return response.data?.content || response.data || [];
        } catch (err) {
            showError('Failed to fetch food items');
            console.error('Fetch food items error:', err);
            return [];
        }
    };

    const addFoodItemsToMenu = async (menuName, foodItemNames) => {
        try {
            const response = await apiClient.put(`/menus/${encodeURIComponent(menuName)}/food-items`, {
                names: foodItemNames
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const removeFoodItemsFromMenu = async (menuName, foodItemNames) => {
        try {
            const response = await apiClient.delete(`/menus/${encodeURIComponent(menuName)}/food-items`, {
                data: { names: foodItemNames }
            });
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    const handleAddMenuClick = () => {
        setCurrentMenu({ menuName: '', description: '' });
        setIsEditing(false);
        setShowMenuModal(true);
    };

    const handleEditMenuClick = (menu) => {
        setCurrentMenu({ 
            ...menu, 
            originalMenuName: menu.menuName // Store original name for API call
        });
        setIsEditing(true);
        setShowMenuModal(true);
    };

    const handleViewMenuClick = async (menu) => {
        const menuDetails = await fetchMenuByName(menu.menuName);
        if (menuDetails) {
            setSelectedMenuContent(menuDetails);
            setShowContentModal(true);
        }
    };

    const handleManageFoodItemsClick = async (menu) => {
        try {
            setLoadingFoodItems(true);
            setSelectedMenuForFoodItems(menu);
            
            // Fetch all available food items and current menu details
            const [allFoodItems, menuDetails] = await Promise.all([
                fetchAllFoodItems(),
                fetchMenuByName(menu.menuName)
            ]);
            
            setAvailableFoodItems(allFoodItems);
            setMenuFoodItems(menuDetails?.foodItems || []);
            setOriginalMenuFoodItems(menuDetails?.foodItems || []);
            setPendingChanges({ toAdd: [], toRemove: [] });
            setShowManageFoodItemsModal(true);
        } catch (err) {
            showError('Failed to load food items data');
            console.error('Manage food items error:', err);
        } finally {
            setLoadingFoodItems(false);
        }
    };

    const handleAddFoodItemToMenu = (item) => {
        const newMenuFoodItems = [...menuFoodItems, item];
        setMenuFoodItems(newMenuFoodItems);
        
        // Update pending changes
        const newPendingChanges = { ...pendingChanges };
        
        // If this item was in the remove list, remove it from there
        newPendingChanges.toRemove = newPendingChanges.toRemove.filter(name => name !== item.foodName);
        
        // If this item wasn't in the original menu, add it to the add list
        const wasInOriginal = originalMenuFoodItems.find(original => original.foodName === item.foodName);
        if (!wasInOriginal && !newPendingChanges.toAdd.includes(item.foodName)) {
            newPendingChanges.toAdd.push(item.foodName);
        }
        
        setPendingChanges(newPendingChanges);
    };

    const handleRemoveFoodItemFromMenu = (item) => {
        const newMenuFoodItems = menuFoodItems.filter(menuItem => menuItem.foodName !== item.foodName);
        setMenuFoodItems(newMenuFoodItems);
        
        // Update pending changes
        const newPendingChanges = { ...pendingChanges };
        
        // If this item was in the add list, remove it from there
        newPendingChanges.toAdd = newPendingChanges.toAdd.filter(name => name !== item.foodName);
        
        // If this item was in the original menu, add it to the remove list
        const wasInOriginal = originalMenuFoodItems.find(original => original.foodName === item.foodName);
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
                promises.push(addFoodItemsToMenu(selectedMenuForFoodItems.menuName, pendingChanges.toAdd));
            }
            
            // Remove food items
            if (pendingChanges.toRemove.length > 0) {
                promises.push(removeFoodItemsFromMenu(selectedMenuForFoodItems.menuName, pendingChanges.toRemove));
            }
            
            if (promises.length > 0) {
                await Promise.all(promises);
                
                const addedCount = pendingChanges.toAdd.length;
                const removedCount = pendingChanges.toRemove.length;
                
                let message = '';
                if (addedCount > 0 && removedCount > 0) {
                    message = `Added ${addedCount} and removed ${removedCount} food items`;
                } else if (addedCount > 0) {
                    message = `Added ${addedCount} food item(s) to menu`;
                } else if (removedCount > 0) {
                    message = `Removed ${removedCount} food item(s) from menu`;
                }
                
                showSuccess(message);
                fetchMenus(); // Refresh the menu list to show updated food item counts
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
        setMenuFoodItems(originalMenuFoodItems);
        setPendingChanges({ toAdd: [], toRemove: [] });
        setShowManageFoodItemsModal(false);
    };

    const handleDeleteMenu = async (menu) => {
        const confirmed = await confirm({
            title: 'Delete Menu',
            message: `Are you sure you want to delete menu "${menu.menuName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            confirmVariant: 'danger'
        });

        if (confirmed) {
            try {
                await apiClient.delete(`/menus/${encodeURIComponent(menu.menuName)}`);
                showSuccess('Menu deleted successfully');
                fetchMenus();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete menu';
                showError(errorMessage);
                console.error('Delete menu error:', err);
            }
        }
    };

    const handleSaveMenu = async (e) => {
        e.preventDefault();
        
        if (!currentMenu.menuName.trim()) {
            showError('Menu name is required');
            return;
        }

        try {
            const payload = {
                menuName: currentMenu.menuName.trim(),
                description: currentMenu.description?.trim() || ''
            };

            if (isEditing) {
                // Update existing menu - use the original menu name for the URL
                const originalMenuName = currentMenu.originalMenuName || currentMenu.menuName;
                await apiClient.put(`/menus/${encodeURIComponent(originalMenuName)}`, payload);
                showSuccess('Menu updated successfully');
            } else {
                // Create new menu
                await apiClient.post('/menus', payload);
                showSuccess('Menu created successfully');
            }

            fetchMenus();
            setShowMenuModal(false);
            setCurrentMenu(null);
            setIsEditing(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} menu`;
            showError(errorMessage);
            console.error('Save menu error:', err);
        }
    };

    const handleSetActiveMenus = async () => {
        const selectedMenuNames = Array.from(selectedMenusForActive);
        
        if (selectedMenuNames.length === 0) {
            showWarning('Please select at least one menu to set as active');
            return;
        }

        const confirmed = await confirm({
            title: 'Set Active Menus',
            message: `Are you sure you want to set ${selectedMenuNames.length} menu(s) as active? This will make all other menus inactive.`,
            confirmText: 'Set Active',
            confirmVariant: 'primary'
        });

        if (confirmed) {
            try {
                await apiClient.post('/menus/active', {
                    names: selectedMenuNames
                });
                showSuccess(`${selectedMenuNames.length} menu(s) set as active successfully`);
                fetchMenus();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to set active menus';
                showError(errorMessage);
                console.error('Set active menus error:', err);
            }
        }
    };

    const handleMenuActiveSelection = (menuName, isSelected) => {
        const newSelection = new Set(selectedMenusForActive);
        if (isSelected) {
            newSelection.add(menuName);
        } else {
            newSelection.delete(menuName);
        }
        setSelectedMenusForActive(newSelection);
    };

    const handleSelectAllActive = () => {
        if (selectedMenusForActive.size === menus.length) {
            // Deselect all
            setSelectedMenusForActive(new Set());
        } else {
            // Select all
            const allMenuNames = menus.map(menu => menu.menuName);
            setSelectedMenusForActive(new Set(allMenuNames));
        }
    };

    // DataTable columns configuration
    const columns = [
        { 
            key: 'menuName', 
            header: 'Menu Name', 
            accessor: 'menuName',
            render: (value) => <strong>{value}</strong>
        },
        { 
            key: 'description', 
            header: 'Description', 
            accessor: 'description',
            render: (value) => value || 'No description'
        },
        { 
            key: 'status', 
            header: (
                <div className="d-flex align-items-center">
                    <div style={{ minWidth: 70 }}>Status</div>
                    <div className="ms-auto me-auto">
                        <Form.Check
                            type="checkbox"
                            checked={selectedMenusForActive.size === menus.length && menus.length > 0}
                            onChange={handleSelectAllActive}
                            title="Select/Deselect All"
                        />
                    </div>
                </div>
            ), 
            accessor: 'active',
            className: 'text-center',
            sortable: false,
            render: (value, menu) => (
                <div className="d-flex align-items-center">
                    <Badge bg={value ? "success" : "secondary"} style={{ minWidth: 70 }}>
                        {value ? "Active" : "Inactive"}
                    </Badge>
                    <div className="ms-auto me-auto">
                        <Form.Check
                            type="checkbox"
                            checked={selectedMenusForActive.has(menu.menuName)}
                            onChange={(e) => handleMenuActiveSelection(menu.menuName, e.target.checked)}
                            title="Select for setting as active"
                        />
                    </div>
                </div>
            )
        },
        { 
            key: 'foodItems', 
            header: 'Food Items', 
            accessor: 'foodItems',
            render: (value, menu) => (
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
                                handleManageFoodItemsClick(menu);
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
            accessor: 'menuName',
            sortable: false,
            render: (value, menu) => (
                <div className="d-flex gap-1 flex-wrap">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleViewMenuClick(menu); }}
                    >View</Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEditMenuClick(menu); }}
                    >Edit</Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteMenu(menu); }}
                    >Delete</Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <Container className="text-center mt-4">
                <Spinner animation="border" />
                <p className="mt-3">Loading menus...</p>
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
                <h1>Menu Management</h1>
                <div className="d-flex gap-2">
                    {menus.length > 0 && (
                        <Button 
                            variant="success" 
                            onClick={handleSetActiveMenus}
                            disabled={selectedMenusForActive.size === 0}
                        >
                            <i className="bi bi-check-circle me-2"></i>
                            Set Active ({selectedMenusForActive.size})
                        </Button>
                    )}
                    <Button variant="primary" onClick={handleAddMenuClick}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add New Menu
                    </Button>
                </div>
            </div>


            {/* Alert If there is no menu named 'Featured' or if there is no items in 'Featured' menu */}
            {!menus.find(menu => menu.menuName === 'Featured') ? (
                <Alert variant="warning" className="text-center">
                    You should add a menu named 'Featured'! <br />
                    This menu will be used to showcase relevant foods for Customers.
                </Alert>
            ) : menus.find(menu => menu.menuName === 'Featured').foodItems.length < 6 ? (
                <Alert variant="info" className="text-center">
                    You should add at least 6 foods to the 'Featured' menu! It is advisable to have at least 10 items in 'Featured' menu.
                </Alert>
            ) : null}

            {menus.length === 0 ? (
                <Card>
                    <Card.Body className="text-center">
                        <p className="text-muted">No menus found. Create your first menu to get started.</p>
                        <Button variant="primary" onClick={handleAddMenuClick}>
                            Create First Menu
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <DataTable
                    data={menus}
                    columns={columns}
                    loading={loading}
                    searchable={true}
                    sortable={true}
                    paginated={false}
                    emptyMessage="No menus found"
                />
            )}

            {/* Add/Edit Menu Modal */}
            <Modal show={showMenuModal} onHide={() => setShowMenuModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Menu' : 'Add New Menu'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveMenu}>
                    <Modal.Body>
                        {currentMenu && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Menu Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={currentMenu.menuName}
                                        onChange={(e) => setCurrentMenu({ ...currentMenu, menuName: e.target.value })}
                                        required
                                        placeholder="Enter menu name"
                                    />
                                    {isEditing && (
                                        <Form.Text className="text-muted">
                                            Changing the menu name will update the menu identifier
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={currentMenu.description}
                                        onChange={(e) => setCurrentMenu({ ...currentMenu, description: e.target.value })}
                                        placeholder="Enter menu description (optional)"
                                    />
                                </Form.Group>
                                {!isEditing && (
                                    <Alert variant="info">
                                        <small>
                                            <strong>Note:</strong> After creating the menu, you can add food items to it from the Food Items page.
                                        </small>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowMenuModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update Menu' : 'Create Menu'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Menu Content Modal */}
            <Modal show={showContentModal} onHide={() => setShowContentModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Menu Contents: {selectedMenuContent?.menuName}
                        {selectedMenuContent?.active && (
                            <Badge bg="success" className="ms-2">Active</Badge>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMenuContent && (
                        <>
                            {selectedMenuContent.description && (
                                <Alert variant="light">
                                    <strong>Description:</strong> {selectedMenuContent.description}
                                </Alert>
                            )}
                            
                            <h5>Food Items ({selectedMenuContent.foodItems?.length || 0})</h5>
                            {selectedMenuContent.foodItems && selectedMenuContent.foodItems.length > 0 ? (
                                <ListGroup>
                                    {selectedMenuContent.foodItems.map((item, index) => (
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
                                    This menu has no food items yet. Add food items from the Food Items page.
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContentModal(false)}>
                        Close
                    </Button>
                    {selectedMenuContent && (
                        <Button 
                            variant="primary" 
                            onClick={() => {
                                setShowContentModal(false);
                                handleEditMenuClick(selectedMenuContent);
                            }}
                        >
                            Edit Menu
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Manage Food Items Modal */}
            <Modal show={showManageFoodItemsModal} onHide={handleCancelFoodItemChanges} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Manage Food Items: {selectedMenuForFoodItems?.menuName}
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
                                <h6>Available Food Items ({availableFoodItems.length - menuFoodItems.length})</h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <ListGroup>
                                        {availableFoodItems
                                            .filter(item => !menuFoodItems.find(menuItem => menuItem.foodName === item.foodName))
                                            .map((item, index) => {
                                                const wasInOriginal = originalMenuFoodItems.find(original => original.foodName === item.foodName);
                                                const isNewlyRemoved = wasInOriginal && !menuFoodItems.find(menuItem => menuItem.foodName === item.foodName);

                                                return (
                                                <ListGroup.Item 
                                                    variant='secondary'
                                                    key={index} 
                                                    className={`d-flex justify-content-between align-items-center ${isNewlyRemoved ? 'border border-danger' : ''}`}
                                                >
                                                    <div>
                                                        <strong>{item.foodName}</strong>
                                                        {isNewlyRemoved && (<Badge bg="danger" className="ms-2 small">Removed</Badge>
                                                        )}
                                                        {item.description && (
                                                            <div className="text-muted small">{item.description}</div>
                                                        )}
                                                        <Badge bg="primary" className="me-1">
                                                            ${item.price?.toFixed(2) || '0.00'}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant={`outline-${isNewlyRemoved ? 'danger' : 'success'}`}
                                                        size="sm"
                                                        onClick={() => handleAddFoodItemToMenu(item)}
                                                    >
                                                        <i className="bi bi-plus"></i> Add
                                                    </Button>
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>
                                    {availableFoodItems.filter(item => !menuFoodItems.find(menuItem => menuItem.foodName === item.foodName)).length === 0 && (
                                        <Alert variant="info">All available food items are already in this menu.</Alert>
                                    )}
                                </div>
                            </Col>
                            <Col md={6}>
                                <h6>Current Menu Items ({menuFoodItems.length})</h6>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <ListGroup>
                                        {menuFoodItems.map((item, index) => {
                                            const wasInOriginal = originalMenuFoodItems.find(original => original.foodName === item.foodName);
                                            const isNewlyAdded = !wasInOriginal;
                                            
                                            return (
                                                <ListGroup.Item 
                                                    key={index} 
                                                    className={`d-flex justify-content-between align-items-center ${isNewlyAdded ? 'bg-light border border-success' : ''}`}
                                                >
                                                    <div>
                                                        <strong>{item.foodName}</strong>
                                                        {isNewlyAdded && (
                                                            <Badge bg="success" className="ms-2 small">NEW</Badge>
                                                        )}
                                                        {item.description && (
                                                            <div className="text-muted small">{item.description}</div>
                                                        )}
                                                        <Badge bg="primary" className="me-1">
                                                            ${item.price?.toFixed(2) || '0.00'}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant={`outline-${isNewlyAdded ? 'success' : 'danger'}`}
                                                        size="sm"
                                                        onClick={() => handleRemoveFoodItemFromMenu(item)}
                                                    >
                                                        <i className="bi bi-dash"></i> Remove
                                                    </Button>
                                                </ListGroup.Item>
                                            );
                                        })}
                                    </ListGroup>
                                    {menuFoodItems.length === 0 && (
                                        <Alert variant="warning">This menu has no food items yet.</Alert>
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
        </Container>
    );
};

export default AdminMenuPage;
