import { useContext } from 'react';
import { ConfirmationContext } from '../contexts/confirmationContext.js';

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};
