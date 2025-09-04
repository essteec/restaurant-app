import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Badge, Alert, Dropdown } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { publicApiClient } from '@api';
import { useCart } from "@contexts/use-cart.js";
import { LoadingSpinner } from '../../components';
import { API_CONFIG } from '@utils/constants.js';
import { formatCurrency } from '@utils/helpers.js';
import './MenuPage.css'; // We'll create this for custom styles

const MenuPage = () => {
    const [categories, setCategories] = useState([]);
    const [supportedLanguages, setSupportedLanguages] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [languagesLoading, setLanguagesLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchParams] = useSearchParams();
    const { addItem, selectTable, selectedTable } = useCart();
    const [activeTab, setActiveTab] = useState('');
    const [popularFoods, setPopularFoods] = useState([]);
    const [showAllPopular, setShowAllPopular] = useState(false);
    const [popularLoading, setPopularLoading] = useState(true);

    useEffect(() => {
        // Fetch supported languages on component mount
        const fetchSupportedLanguages = async () => {
            try {
                setLanguagesLoading(true);
                console.log('Fetching supported languages...');
                const response = await publicApiClient.get('/languages/supported');
                console.log('Supported languages response:', response.data);
                
                if (response.data && Array.isArray(response.data)) {
                    setSupportedLanguages(response.data);
                } else {
                    console.warn('Unexpected language response format:', response.data);
                    setSupportedLanguages(['en']); // Fallback to English
                }
            } catch (err) {
                console.error('Failed to fetch supported languages:', err);
                // Fallback languages based on what we know from the backend
                const fallbackLanguages = ['en', 'tr']; // English and Turkish as defaults
                setSupportedLanguages(fallbackLanguages);
                console.log('Using fallback languages:', fallbackLanguages);
            } finally {
                setLanguagesLoading(false);
            }
        };

        fetchSupportedLanguages();
    }, []);

    useEffect(() => {
        // Fetch popular foods and respect selected language for consistency
        const fetchPopularFoods = async () => {
            try {
                setPopularLoading(true);
                console.log('Fetching popular foods...');
                const response = await publicApiClient.get('/food-items/most-popular', {
                    headers: { 'Accept-Language': selectedLanguage }
                });
                console.log('Popular foods response:', response.data);
                
                if (response.data && Array.isArray(response.data)) {
                    // Transform to match the food item structure used elsewhere
                    const transformedFoods = response.data.map(food => ({
                        id: food.foodName, // Use foodName as ID since it's unique
                        foodId: food.foodName,
                        foodName: food.foodName,
                        originalFoodName: food.foodName,
                        price: food.price,
                        image: food.image,
                        description: food.description
                    }));
                    setPopularFoods(transformedFoods);
                } else {
                    console.warn('Unexpected popular foods response format:', response.data);
                    setPopularFoods([]);
                }
            } catch (err) {
                console.error('Failed to fetch popular foods:', err);
                setPopularFoods([]);
            } finally {
                setPopularLoading(false);
            }
        };

        fetchPopularFoods();
    }, [selectedLanguage]);
    
    useEffect(() => {
        let isMounted = true;
        const tableParam = searchParams.get('table');
        if (categories.length > 0 && !activeTab) {
            setActiveTab(categories[0].categoryName);
        }
        if (tableParam && (!selectedTable || selectedTable.tableNumber !== tableParam)) {
            console.log('QR table detected in MenuPage (setting):', tableParam);
            selectTable({ tableNumber: tableParam }, true); // Pass true to indicate it's from QR
            setSuccessMessage(`🏷️ Table ${tableParam} selected from QR code!`);
            setTimeout(() => setSuccessMessage(''), 4000);
        } else if (tableParam) {
            console.log('QR table detected but already set in context:', tableParam);
        }
        
        const fetchMenuData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('Fetching menu data with language:', selectedLanguage);
                
                // Get the active menu with language header
                const activeMenuResponse = await publicApiClient.get('/menus/active', {
                    headers: {
                        'Accept-Language': selectedLanguage
                    }
                });
                console.log('Active menu response:', activeMenuResponse.data);
                
                if (activeMenuResponse.data && activeMenuResponse.data.length > 0) {
                    // Transform the data structure to match what the UI expects
                    const transformedCategories = activeMenuResponse.data.map(category => ({
                        categoryName: category.categoryName,
                        foods: category.foodItems || []
                    }));
                    
                    if (isMounted) {
                        setCategories(transformedCategories);
                        console.log('Successfully loaded active menu:', transformedCategories);
                    }
                    return;
                }
                
                // If no active menu found, throw error instead of fallback
                throw new Error('No active menu found');
                
            } catch (err) {
                console.error('Menu fetch error:', err);
                
                if (isMounted) {
                    setError(`Unable to load menu: ${err.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchMenuData();
        
        return () => {
            isMounted = false;
        };
    }, [searchParams, selectedTable, selectTable, selectedLanguage]);

    const handleLanguageChange = (langCode) => {
        console.log('Language changed to:', langCode);
        setSelectedLanguage(langCode);
        setActiveTab(''); // Reset active tab when language changes
    };

    const getLanguageDisplayName = (langCode) => {
        const languageNames = {
            'en': 'English 🇺🇸',
            'tr': 'Türkçe 🇹🇷',
            'es': 'Español 🇪🇸',
            'fr': 'Français 🇫🇷',
            'de': 'Deutsch 🇩🇪',
            'it': 'Italiano 🇮🇹',
            'pt': 'Português 🇵🇹',
            'ru': 'Русский 🇷🇺',
            'zh': '中文 🇨🇳',
            'ja': '日本語 🇯🇵',
            'ko': '한국어 🇰🇷',
            'ar': 'العربية 🇸🇦',
            'hi': 'हिन्दी 🇮🇳'
        };
        return languageNames[langCode] || langCode.toUpperCase();
    };

    const handleAddToCart = (item, e) => { 
        try {
            // Prevent default behavior in case this is inside a form or has accidental submit
            if (e?.preventDefault) e.preventDefault();
            if (e?.stopPropagation) e.stopPropagation();
            addItem({
                id: item.foodId || item.id,
                foodName: item.foodName,
                originalFoodName: item.originalFoodName || item.foodName, // Store original name for backend
                price: item.price,
                image: item.image,
                description: item.description
            });
            
            // Show success message
            // setSuccessMessage(`${item.foodName} added to cart!`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error adding item to cart:', err);
            setError('Failed to add item to cart. Please try again.');
        }
    };

    const FoodCard = ({ item }) => {
        const [imageError, setImageError] = useState(false);
        const imageUrl = item.image ? `${API_CONFIG.IMAGE_BASE_URL}${item.image}` : null;
        
        return (
            <Card className="food-card h-100 shadow-sm border-0">
                <div className="food-image-container">
                    {imageUrl && !imageError ? (
                        <Card.Img 
                            variant="top"
                            src={imageUrl}
                            className="food-image"
                            onError={() => setImageError(true)}
                            alt={item.foodName}
                            loading ="lazy"
                        />
                    ) : (
                        <div className="food-image-placeholder d-flex align-items-center justify-content-center">
                            <div className="text-center text-muted">
                                <div style={{ fontSize: '3rem' }}>🍽️</div>
                                <p className="mt-2 mb-0 small">{item.foodName}</p>
                            </div>
                        </div>
                    )}
                    <div className="food-price-badge">
                        <Badge bg="primary" className="price-badge">
                            {formatCurrency(item.price)}
                        </Badge>
                    </div>
                </div>
                
                <Card.Body className="d-flex flex-column">
                    <div className="food-header mb-2">
                        <Card.Title className="food-title h5 mb-1">{item.foodName}</Card.Title>
                    </div>
                    
                    <Card.Text className="food-description text-muted flex-grow-1 small">
                        {item.description || 'Delicious dish prepared with fresh ingredients'}
                    </Card.Text>
                    
                    <div className="food-actions mt-auto pt-3">
                        <Button 
                            variant="primary" 
                            onClick={(e) => handleAddToCart(item, e)}
                            className="add-to-cart-btn w-100"
                            size="sm"
                            type="button"
                        >
                            🛒 Add to Cart
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        );
    };

    if (loading || languagesLoading || popularLoading) {
        return (
            <Container className="menu-loading-container">
                <div className="text-center py-5">
                    <LoadingSpinner size="lg" />
                    <h4 className="mt-3 text-muted">
                        {languagesLoading ? 'Loading languages...' : 
                         popularLoading ? 'Loading popular dishes...' : 
                         'Loading our delicious menu...'}
                    </h4>
                    <p className="text-muted">Please wait while we fetch the latest dishes</p>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert 
                    variant="danger" 
                    className="text-center"
                >
                    <Alert.Heading>
                        ⚠️ Menu Unavailable
                    </Alert.Heading>
                    <p>{error}</p>
                    <Button 
                        variant="outline-danger" 
                        onClick={() => window.location.reload()}
                        className="mt-2"
                    >
                        🔄 Try Again
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!categories || categories.length === 0) {
        return (
            <Container className="mt-4">
                <Alert variant="info" className="text-center">
                    <Alert.Heading>Menu Coming Soon</Alert.Heading>
                    <p className="text-muted">No menu items are currently available. Please check back later!</p>
                    <Button 
                        variant="outline-primary" 
                        onClick={() => window.location.reload()}
                        className="mt-2"
                    >
                        🔄 Refresh
                    </Button>
                </Alert>
            </Container>
        );
    }

    return (
        <div className="menu-page">
            <Container fluid className="menu-hero-section bg-light py-4 mb-4">
                <Container>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="display-4 mb-2 text-primary">Our Menu</h1>
                            <p className="lead text-muted">
                                Discover our carefully crafted dishes made with the finest ingredients
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-3">
                                
                                {/* Language Selector - Always show if languages are available */}
                                {supportedLanguages.length > 0 && (
                                    <Dropdown>
                                        <Dropdown.Toggle variant="primary" id="language-dropdown" size="sm">
                                            <i className="bi bi-globe me-2"></i>
                                            {getLanguageDisplayName(selectedLanguage)}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Header>Select Language</Dropdown.Header>
                                            <Dropdown.Item
                                                key={'en'}
                                                active={'en' === selectedLanguage}
                                                onClick={() => handleLanguageChange('en')}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                Default
                                            </Dropdown.Item>
                                                {supportedLanguages.map(langCode => (
                                            <Dropdown.Item
                                                key={langCode}
                                                active={langCode === selectedLanguage}
                                                onClick={() => handleLanguageChange(langCode)}
                                                className="d-flex align-items-center gap-2"
                                            >
                                                {getLanguageDisplayName(langCode)}
                                            </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Container>

            <Container>
                {successMessage && (
                    <Alert 
                        variant="success" 
                        className="alert-dismissible fade show"
                        onClose={() => setSuccessMessage('')}
                        dismissible
                    >
                        ✅ {successMessage}
                    </Alert>
                )}

                {/* Popular Foods Section */}
                {popularFoods.length > 0 && (
                    <div className="popular-foods-section mb-5">
                        <div className="text-center mb-4">
                            <h2 className="h3 text-primary mb-2"><i className="bi bi-star"></i> Most Popular Dishes</h2>
                            <p className="text-muted">Customer favorites that keep them coming back!</p>
                        </div>
                        
                        <Row xs={1} sm={2} lg={3} xl={4} className="g-4 mb-3">
                            {popularFoods
                                .slice(0, showAllPopular ? popularFoods.length : 4)
                                .map(item => (
                                    <Col key={item.id}>
                                        <FoodCard item={item} />
                                    </Col>
                                ))
                            }
                        </Row>
                        
                        {popularFoods.length > 4 && (
                            <div className="text-center">
                                <Button 
                                    variant="outline-primary" 
                                    onClick={() => setShowAllPopular(!showAllPopular)}
                                    className="px-4"
                                >
                                    {showAllPopular ? (
                                        <>
                                            <i className="bi bi-chevron-up me-2"></i>
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-chevron-down me-2"></i>
                                            Show More Popular Dishes ({popularFoods.length - 4} more)
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                        
                        <hr className="my-5" />
                    </div>
                )}

                <Tabs
                    activeKey={activeTab || (categories.length > 0 ? categories[0].categoryName : '')}
                    onSelect={setActiveTab}
                    id="menu-tabs" 
                    className="menu-tabs mb-4"
                    fill
                >
                    {categories.map(category => (
                        <Tab 
                            eventKey={category.categoryName} 
                            title={
                                <span>
                                    {category.categoryName}
                                    <Badge bg="light" text="dark" className="ms-2">
                                        {category.foods?.length || 0}
                                    </Badge>
                                </span>
                            }
                            key={category.categoryName}
                        >
                            <div className="category-content">
                                <div className="category-header text-center mb-4">
                                    <h2 className="h3 text-primary">{category.categoryName}</h2>
                                    <p className="text-muted">
                                        {category.foods?.length || 0} delicious options to choose from
                                    </p>
                                </div>

                                {category.foods && category.foods.length > 0 ? (
                                    <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
                                        {category.foods.map(item => (
                                            <Col key={item.foodId || item.id || item.foodName}>
                                                <FoodCard item={item} />
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <Alert variant="light" className="text-center">
                                        ℹ️ No items available in this category at the moment.
                                    </Alert>
                                )}
                            </div>
                        </Tab>
                    ))}
                </Tabs>
            </Container>
        </div>
    );
};

export default MenuPage;