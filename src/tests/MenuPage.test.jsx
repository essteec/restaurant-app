import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext.jsx';
import { CartProvider } from '../contexts/CartContext.jsx';
import MenuPage from '../pages/public/MenuPage.jsx';
import {jest} from "globals";

// Mock the API client
jest.mock('../api', () => ({
  get: jest.fn(() => Promise.resolve({
    data: [
      {
        categoryName: 'Appetizers',
        foods: [
          {
            foodId: 1,
            foodName: 'Caesar Salad',
            description: 'Fresh romaine lettuce with Caesar dressing',
            price: 12.99,
            image: 'caesar-salad.jpg'
          }
        ]
      }
    ]
  }))
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('MenuPage', () => {
  test('renders menu page without crashing', async () => {
    render(
      <TestWrapper>
        <MenuPage />
      </TestWrapper>
    );
    
    expect(screen.getByText('Loading menu...')).toBeInTheDocument();
  });
});
