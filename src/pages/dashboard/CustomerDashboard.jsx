import { Container } from 'react-bootstrap';
import useAuth from '../../contexts/use-auth.js';
import routes from '../../routes/routes.js';
import UserWelcome from './components/UserWelcome.jsx';
import QuickActions from './components/QuickActions.jsx';

const CustomerDashboard = () => {
    const { user } = useAuth();

    const customerActions = [
        {
            to: routes.ORDERS,
            label: 'View My Orders',
            variant: 'primary',
            icon: 'bi bi-receipt'
        },
        {
            to: routes.MENU,
            label: 'Browse Menu',
            variant: 'outline-secondary',
            icon: 'bi bi-book'
        },
        {
            to: routes.CART,
            label: 'View Cart',
            variant: 'outline-primary',
            icon: 'bi bi-cart'
        }
    ];

    return (
        <Container className="mt-4">
            <UserWelcome
                subtitle="What would you like to order today?"
            />
            <QuickActions actions={customerActions} />
        </Container>
    );
};

export default CustomerDashboard;
