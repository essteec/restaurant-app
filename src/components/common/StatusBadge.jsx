import { Badge } from 'react-bootstrap';
import { getOrderStatusVariant, getTableStatusVariant } from '@utils/helpers.js';

const StatusBadge = ({ status, type = 'order', className = '', ...props }) => {
  const getVariant = () => {
    switch (type) {
      case 'order':
        return getOrderStatusVariant(status);
      case 'table':
        return getTableStatusVariant(status);
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status) => {
    return status
      ? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      : 'Unknown';
  };

  return (
    <Badge 
      bg={getVariant()} 
      className={`px-2 py-1 ${className}`}
      {...props}
    >
      {formatStatus(status)}
    </Badge>
  );
};

export default StatusBadge;
