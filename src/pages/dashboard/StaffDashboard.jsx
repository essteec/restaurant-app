import { Container } from 'react-bootstrap';
import useAuth from '../../contexts/use-auth.js';
import routes from '../../routes/routes.js';
import UserWelcome from './components/UserWelcome.jsx';
import QuickActions from './components/QuickActions.jsx';

const StaffDashboard = () => {
    const { user } = useAuth();
    
    const getStaffActions = () => {
        const actions = [];
        
        // Chef actions
        if (user?.role === 'CHEF') {
            actions.push({
                to: routes.CHEF_ORDERS,
                label: 'Kitchen Orders',
                variant: 'primary',
                icon: 'bi bi-fire'
            });
        }
        
        // Waiter actions
        if (user?.role === 'WAITER') {
            actions.push(
                {
                    to: routes.WAITER_ORDERS,
                    label: 'Waiter Orders',
                    variant: 'primary',
                    icon: 'bi bi-receipt'
                },
                {
                    to: routes.WAITER_TABLES,
                    label: 'Table Management',
                    variant: 'info',
                    icon: 'bi bi-table'
                },
                {
                    to: routes.WAITER_CALL_REQUESTS,
                    label: 'Call Requests',
                    variant: 'warning',
                    icon: 'bi bi-telephone'
                }
            );
        }
        
        // Common actions for all staff
        actions.push({
            to: routes.MENU,
            label: 'Browse Menu',
            variant: 'outline-secondary',
            icon: 'bi bi-book'
        });
        
        return actions;
    };

    const getSubtitle = () => {
        switch (user?.role) {
            case 'CHEF':
                return 'Ready to prepare some delicious meals?';
            case 'WAITER':
                return 'Ready to serve our customers?';
            default:
                return 'What would you like to do today?';
        }
    };

    return (
        <Container className="mt-4">
            <UserWelcome 
                user={user} 
                subtitle={getSubtitle()}
            />
            <QuickActions actions={getStaffActions()} />
        </Container>
    );
};

export default StaffDashboard;
