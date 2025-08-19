import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const QuickActions = ({ actions }) => {
    return (
        <div className="d-grid gap-2 col-md-6 mx-auto">
            {actions.map((action, index) => {
                if (action.to) {
                    // Navigation link
                    return (
                        <Button 
                            key={index}
                            as={Link} 
                            to={action.to} 
                            variant={action.variant || 'primary'} 
                            size="lg"
                            className={action.className}
                        >
                            {action.icon && <i className={`${action.icon} me-2`}></i>}
                            {action.label}
                        </Button>
                    );
                } else if (action.onClick) {
                    // Click handler
                    return (
                        <Button 
                            key={index}
                            onClick={action.onClick}
                            variant={action.variant || 'primary'} 
                            size="lg"
                            className={action.className}
                        >
                            {action.icon && <i className={`${action.icon} me-2`}></i>}
                            {action.label}
                        </Button>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default QuickActions;
