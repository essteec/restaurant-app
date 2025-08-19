import { useState, useEffect } from "react";
import { CartContext } from "./CartContextExport.jsx";
import { storage, calculateCartTotal, calculateCartQuantity } from '../utils/helpers.js';
import { STORAGE_KEYS } from '../utils/constants.js';

// Create the cart provider component
export const CartProvider = ({ children }) => {
    // Lazy initialization to avoid post-mount overwrite
    const [cartItems, setCartItems] = useState(() => storage.get(STORAGE_KEYS.CART_ITEMS, []));
    const [selectedTable, setSelectedTable] = useState(() => storage.get(STORAGE_KEYS.SELECTED_TABLE, null));
    const [cartNotes, setCartNotes] = useState(() => storage.get(STORAGE_KEYS.CART_NOTES, ''));
    const [selectedAddress, setSelectedAddress] = useState(() => storage.get(STORAGE_KEYS.SELECTED_ADDRESS, null));
    const [addresses, setAddresses] = useState([]);

    // On mount only fetch remaining persisted pieces (addresses not persisted here)
    // NOTE: We intentionally DO NOT overwrite selectedTable if storage has null.
    useEffect(() => {
        // cartItems / cartNotes / selectedTable already initialized lazily
        // selectedAddress already initialized lazily
        // If future: load addresses from profile when authenticated
    }, []);

    // Persist cart-related state
    useEffect(() => { storage.set(STORAGE_KEYS.CART_ITEMS, cartItems); }, [cartItems]);
    useEffect(() => { storage.set(STORAGE_KEYS.SELECTED_TABLE, selectedTable); }, [selectedTable]);
    useEffect(() => { storage.set(STORAGE_KEYS.CART_NOTES, cartNotes); }, [cartNotes]);
    useEffect(() => { storage.set(STORAGE_KEYS.SELECTED_ADDRESS, selectedAddress); }, [selectedAddress]);

    // Fix addItem to accept foodName or name and avoid merging everything into first item
    const addItem = (itemToAdd, quantity = 1, notes = '') => {
        setCartItems(prevItems => {
            // Normalize item shape
            const normalized = {
                foodName: itemToAdd.foodName || itemToAdd.name, // support both
                price: itemToAdd.price,
                image: itemToAdd.image || itemToAdd.imageUrl || itemToAdd.imagePath,
                description: itemToAdd.description || '',
                id: itemToAdd.id || itemToAdd.foodId,
            };
            if (!normalized.foodName) return prevItems; // invalid item guard
            const existingItem = prevItems.find(item => item.foodName === normalized.foodName);
            if (existingItem) {
                return prevItems.map(item =>
                    item.foodName === normalized.foodName
                        ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
                        : item
                );
            }
            return [...prevItems, { ...normalized, quantity, notes, addedAt: new Date().toISOString() }];
        });
    };

    // Address helpers
    const setOrCreateAddress = (address) => {
        // If address has no id treat as new and assign temp id
        const addr = { ...address };
        if (!addr.addressId) {
            addr.addressId = 'local-' + Date.now();
        }
        setAddresses(prev => {
            const exists = prev.find(a => a.addressId === addr.addressId);
            if (exists) {
                return prev.map(a => a.addressId === addr.addressId ? addr : a);
            }
            return [...prev, addr];
        });
        setSelectedAddress(addr);
        return addr;
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
    };

    const clearAddress = () => {
        setSelectedAddress(null);
    };

    const removeItem = (foodName) => {
        setCartItems(prevItems => prevItems.filter(item => item.foodName !== foodName));
    };

    const updateQuantity = (foodName, quantity) => {
        const newQuantity = Math.max(0, quantity);
        if (newQuantity === 0) {
            removeItem(foodName);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.foodName === foodName
                        ? { ...item, quantity: newQuantity }
                        : item
                )
            );
        }
    };

    const updateItemNotes = (foodName, notes) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.foodName === foodName
                    ? { ...item, notes: notes }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
        setSelectedTable(null);
        setCartNotes('');
        storage.remove(STORAGE_KEYS.CART_ITEMS);
        storage.remove(STORAGE_KEYS.SELECTED_TABLE);
        storage.remove(STORAGE_KEYS.CART_NOTES);
    };

    const selectTable = (table) => {
        console.log('CartContext: selectTable called with:', table);
        setSelectedTable(table);
    };

    const updateCartNotes = (notes) => {
        setCartNotes(notes);
    };

    // Calculate cart totals
    const cartTotal = calculateCartTotal(cartItems);
    const itemCount = calculateCartQuantity(cartItems);

    // Check if cart is ready for checkout
    const isCartValid = cartItems.length > 0 && (selectedTable || selectedAddress);

    // Get cart summary for order creation
    const getOrderData = () => {
        if (!isCartValid) {
            throw new Error('Cart is not ready for checkout');
        }

        const base = {
            orderItems: cartItems.map(item => ({ foodName: item.foodName, quantity: item.quantity, note: item.notes || '' })),
            notes: cartNotes
        };
        if (selectedTable) base.tableNumber = selectedTable.tableNumber;
        if (selectedAddress) base.addressId = selectedAddress.addressId; // backend can use this
        return base;
    };

    const value = {
        // Cart items
        cartItems,
        addItem,
        removeItem,
        updateQuantity,
        updateItemNotes,
        clearCart,
        
        // Table selection
        selectedTable,
        selectTable,
        
        // Cart notes
        cartNotes,
        updateCartNotes,
        
        // Address selection
        selectedAddress,
        addresses,
        selectAddress,
        clearAddress,
        setOrCreateAddress,
        
        // Calculated values
        cartTotal,
        itemCount,
        isCartValid,
        
        // Utilities
        getOrderData,
        isEmpty: cartItems.length === 0
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
