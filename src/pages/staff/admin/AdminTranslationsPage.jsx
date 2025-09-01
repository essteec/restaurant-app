import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Button, Spinner, Alert, Form, Row, Col, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../../api';
import useAuth from '../../../contexts/use-auth';
import { useToast } from '../../../hooks/useToast.js';
import { AVAILABLE_LANGUAGES } from '../../../utils/constants';

// Helper: chunk an array to limit concurrent requests
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const AdminTranslationsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();

  // Data
  const [categories, setCategories] = useState([]); // [{categoryName}]
  const [foodItems, setFoodItems] = useState([]); // [{foodName, description}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Target language (AiService expects language NAME; we also need code for existing translations)
  const [targetLanguageName, setTargetLanguageName] = useState('');
  const targetLanguage = useMemo(() => AVAILABLE_LANGUAGES.find(l => l.name === targetLanguageName) || null, [targetLanguageName]);

  // Working state (draft) — matches TranslationPackDto shape
  const [categoryTranslations, setCategoryTranslations] = useState({}); // { sourceName: translatedName }
  const [foodTranslations, setFoodTranslations] = useState({}); // { sourceName: [translatedName, translatedDescription] }

  const [loadingExisting, setLoadingExisting] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);

  // Persist drafts per language locally
  const draftStorageKey = useMemo(() => targetLanguageName ? `translations-draft:${targetLanguageName}` : null, [targetLanguageName]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      setError('Access Denied: You do not have administrative privileges.');
      setLoading(false);
      return;
    }
    const init = async () => {
      try {
        setLoading(true);
        // Fetch all categories and food items (try to get large pages)
        const [catsRes, foodsRes] = await Promise.all([
          apiClient.get('/categories', { params: { page: 0, size: 500, sort: 'categoryName,asc' } }),
          apiClient.get('/food-items', { params: { page: 0, size: 1000, sort: 'foodName,asc' } }),
        ]);
        const cats = catsRes.data?.content || catsRes.data || [];
        const foods = foodsRes.data?.content || foodsRes.data || [];
        setCategories(cats);
        setFoodItems(foods);
        setError(null);
      } catch (err) {
        setError('Failed to load data.');
        console.error('Init translations page error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isAuthenticated, user]);

  // Load draft from localStorage when language changes
  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCategoryTranslations(parsed.categoryTranslations || {});
        setFoodTranslations(parsed.foodItemTranslations || {});
      } else {
        // Reset when language changes and no draft
        setCategoryTranslations({});
        setFoodTranslations({});
      }
    } catch (e) {
      console.warn('Failed to parse draft, clearing it');
      localStorage.removeItem(draftStorageKey);
      setCategoryTranslations({});
      setFoodTranslations({});
    }
  }, [draftStorageKey]);

  const saveDraft = () => {
    if (!draftStorageKey) return;
    const payload = {
      targetLanguage: targetLanguageName,
      categoryTranslations,
      foodItemTranslations: foodTranslations,
    };
    localStorage.setItem(draftStorageKey, JSON.stringify(payload));
    showSuccess('Draft saved locally');
  };

  const clearAllFields = () => {
    setCategoryTranslations({});
    setFoodTranslations({});
  };

  // Copy default language (original) category names, food names and descriptions to translation fields
  const copyDefaultLanguage = () => {
    if (!targetLanguageName) {
      showWarning('Please select a target language');
      return;
    }

    // Copy category names
    const newCategoryTranslations = {};
    categories.forEach(cat => {
      newCategoryTranslations[cat.categoryName] = cat.categoryName;
    });

    // Copy food names and descriptions
    const newFoodTranslations = {};
    foodItems.forEach(food => {
      newFoodTranslations[food.foodName] = [
        food.foodName,
        food.description || ''
      ];
    });

    setCategoryTranslations(prev => ({ ...prev, ...newCategoryTranslations }));
    setFoodTranslations(prev => ({ ...prev, ...newFoodTranslations }));

    const catCount = categories.length;
    const foodCount = foodItems.length;
    showSuccess(`Copied default language: ${catCount} categories, ${foodCount} foods`);
  };

  // Fetch existing translations for selected language and prefill
  const loadExistingTranslations = async () => {
    if (!targetLanguage) {
      showWarning('Please select a target language');
      return;
    }
    try {
      setLoadingExisting(true);
      
      // Use the new AI endpoint to get all translations for the language at once
      const res = await apiClient.get(`/ai/translate/${encodeURIComponent(targetLanguageName)}`);
      const pack = res.data || {};
      
      const categoryTranslationsFromAPI = pack.categoryTranslations || {};
      const foodTranslationsFromAPI = pack.foodItemTranslations || {};
      
      setCategoryTranslations(prev => ({ ...prev, ...categoryTranslationsFromAPI }));
      setFoodTranslations(prev => ({ ...prev, ...foodTranslationsFromAPI }));
      
      const catCount = Object.keys(categoryTranslationsFromAPI).length;
      const foodCount = Object.keys(foodTranslationsFromAPI).length;
      showSuccess(`Existing translations loaded: ${catCount} categories, ${foodCount} foods`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load existing translations');
      console.error('loadExistingTranslations error:', err);
    } finally {
      setLoadingExisting(false);
    }
  };

  // Auto-translate using AI for untranslated items only
  const autoTranslate = async () => {
    if (!targetLanguageName) {
      showWarning('Please select a target language');
      return;
    }
    try {
      setLoadingAi(true);
      
      // Increased timeout for AI translation (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes

      const res = await apiClient.post('/ai/translate',
        { name: targetLanguageName },
        { 
          signal: controller.signal,
          timeout: 5 * 60 * 1000 // 5 minutes timeout
        }
      );
      
      clearTimeout(timeoutId);
      
      const pack = res.data || {};
      const cat = pack.categoryTranslations || {};
      const food = pack.foodItemTranslations || {};
      // Merge: keep existing entries unless pack provides a non-null value
      setCategoryTranslations(prev => {
        const base = prev || {};
        const merged = { ...base };
        for (const [key, val] of Object.entries(cat)) {
          if (val !== null && val !== undefined) {
            merged[key] = val;
          }
        }
        return merged;
      });

      setFoodTranslations(prev => {
        const base = prev || {};
        const merged = { ...base };
        for (const [key, val] of Object.entries(food)) {
          if (val !== null && val !== undefined) {
            merged[key] = val;
          }
        }
        return merged;
      });
      const catCount = Object.keys(cat).length;
      const foodCount = Object.keys(food).length;
      showSuccess(`Auto-translated: ${catCount} categories, ${foodCount} foods`);
    } catch (err) {
      if (err.name === 'AbortError') {
        showError('Translation request timed out after 10 minutes. Please try again.');
      } else {
        const msg = err.response?.data?.message || 'AI translation request failed';
        showError(msg);
      }
      console.error('autoTranslate error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const finalize = async () => {
    if (!targetLanguageName) {
      showWarning('Please select a target language');
      return;
    }
    // Build pack with only filled values
    const catOut = Object.fromEntries(Object.entries(categoryTranslations).filter(([, v]) => (v || '').trim().length > 0));
    const foodOut = Object.fromEntries(Object.entries(foodTranslations).filter(([, [n]]) => (n || '').trim().length > 0));

    if (Object.keys(catOut).length === 0 && Object.keys(foodOut).length === 0) {
      showWarning('Nothing to save. Please add or generate translations first.');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/ai/translate/finalize', {
        targetLanguage: targetLanguageName,
        categoryTranslations: catOut,
        foodItemTranslations: foodOut,
      });
      showSuccess('Translations saved to database');
      // Keep draft in sync
      saveDraft();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save translations';
      showError(msg);
      console.error('finalize error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCatChange = (src, val) => setCategoryTranslations(prev => ({ ...prev, [src]: val }));
  const handleFoodNameChange = (src, val) => setFoodTranslations(prev => ({ ...prev, [src]: [val, (prev[src]?.[1] ?? '')] }));
  const handleFoodDescChange = (src, val) => setFoodTranslations(prev => ({ ...prev, [src]: [(prev[src]?.[0] ?? ''), val] }));

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Translations Management</h1>
        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <Link to="/admin/foods">
            <Button variant="outline-secondary">Food Items</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Target Language</Form.Label>
                <Form.Select 
                  value={targetLanguageName} 
                  onChange={(e) => setTargetLanguageName(e.target.value)}
                  disabled={loadingAi}
                >
                  <option value="">Select a language...</option>
                  {AVAILABLE_LANGUAGES.map(l => (
                    <option key={l.code} value={l.name}>{l.flag} {l.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex flex-wrap gap-2">
              <Button variant="outline-primary" onClick={loadExistingTranslations} disabled={!targetLanguageName || loadingExisting || loadingAi}>
                {loadingExisting ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-download me-2"></i>}
                Load existing translations
              </Button>
              <Button variant="outline-info" onClick={copyDefaultLanguage} disabled={!targetLanguageName || loadingAi}>
                <i className="bi bi-copy me-2"></i>
                Copy default language
              </Button>
              <Button variant="outline-success" onClick={saveDraft} disabled={!targetLanguageName || loadingAi}>
                <i className="bi bi-save me-2"></i>
                Save draft
              </Button>
              <Button variant="outline-warning" onClick={clearAllFields} disabled={!targetLanguageName || loadingAi}>
                <i className="bi bi-eraser me-2"></i>
                Clear all fields
              </Button>
              <Button variant="primary" onClick={autoTranslate} disabled={!targetLanguageName || loadingAi}>
                {loadingAi ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-magic me-2"></i>}
                {loadingAi ? 'Translating... (this may take several minutes)' : 'Auto-translate (AI)'}
              </Button>
              <Button variant="success" onClick={finalize} disabled={!targetLanguageName || saving || loadingAi}>
                {saving ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-check2-circle me-2"></i>}
                Finalize & Save
              </Button>
            </Col>
          </Row>
          <div className="mt-3 small text-muted">
            <div>
              Items: <Badge bg="secondary">{categories.length} categories</Badge>{' '}
              <Badge bg="secondary">{foodItems.length} foods</Badge>
            </div>
            <div className="mt-1">
              Filled fields: <Badge bg="info">{Object.values(categoryTranslations).filter(v => (v || '').trim()).length} categories</Badge>{' '}
              <Badge bg="info">{Object.values(foodTranslations).filter(([n, d]) => (n || '').trim() || (d || '').trim()).length} foods</Badge>
            </div>
          </div>
          <Alert variant="light" className="mt-3 mb-0">
            <ul className="mb-0">
              <li>Auto-translate is available only when all fields are empty. Save a draft and clear fields to use it.</li>
              <li>Finalize will save only non-empty translations to the database. Existing entries will be updated.</li>
              {loadingAi && <li className="text-warning"><strong>⚠️ Auto-translation in progress... This may take several minutes. Please do not close this page.</strong></li>}
            </ul>
          </Alert>
        </Card.Body>
      </Card>

      <Row className="g-3">
        <Col md={6}>
          <Card>
            <Card.Header>
              <strong>Categories</strong>
              {loadingAi && <Badge bg="warning" className="ms-2">Translating...</Badge>}
            </Card.Header>
            <Card.Body style={{ height: '80vh', overflowY: 'auto', position: 'relative' }}>
              {loadingAi && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <Spinner animation="border" size="lg" />
                  <div className="mt-2 text-muted">Translating categories...</div>
                </div>
              )}
              {categories.length === 0 ? (
                <Alert variant="secondary">No categories</Alert>
              ) : (
                categories.map(cat => (
                  <div key={cat.categoryName} className="mb-3">
                    <div className="mb-1"><Badge bg="light" text="dark">{cat.categoryName}</Badge></div>
                    <Form.Control
                      type="text"
                      placeholder="Translated name"
                      value={categoryTranslations[cat.categoryName] || ''}
                      onChange={(e) => handleCatChange(cat.categoryName, e.target.value)}
                      disabled={loadingAi}
                    />
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <strong>Food Items</strong>
              {loadingAi && <Badge bg="warning" className="ms-2">Translating...</Badge>}
            </Card.Header>
            <Card.Body style={{ height: '80vh', overflowY: 'auto', position: 'relative' }}>
              {loadingAi && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <Spinner animation="border" size="lg" />
                  <div className="mt-2 text-muted">Translating food items...</div>
                </div>
              )}
              {foodItems.length === 0 ? (
                <Alert variant="secondary">No food items</Alert>
              ) : (
                foodItems.map(food => (
                  <div key={food.foodName} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <Badge bg="light" text="dark">{food.foodName}</Badge>
                      {food.description && <span className="small text-muted">{food.description}</span>}
                    </div>
                    <Row className="g-2">
                      <Col>
                        <Form.Control
                          type="text"
                          placeholder="Translated name"
                          value={foodTranslations[food.foodName]?.[0] || ''}
                          onChange={(e) => handleFoodNameChange(food.foodName, e.target.value)}
                          disabled={loadingAi}
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mt-2">
                      <Col>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Translated description (optional)"
                          value={foodTranslations[food.foodName]?.[1] || ''}
                          onChange={(e) => handleFoodDescChange(food.foodName, e.target.value)}
                          disabled={loadingAi}
                        />
                      </Col>
                    </Row>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminTranslationsPage;
