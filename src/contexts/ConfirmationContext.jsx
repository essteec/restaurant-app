import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ConfirmationContext } from './confirmationContext.js';

export const ConfirmationProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setConfig({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'danger',
        onConfirm: () => {
          setIsOpen(false);
          resolve(true);
          if (options.onConfirm) options.onConfirm();
        },
        onCancel: () => {
          setIsOpen(false);
          resolve(false);
          if (options.onCancel) options.onCancel();
        },
      });
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    config.onCancel();
  };

  const value = {
    confirm,
  };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      
      <Modal show={isOpen} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{config.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{config.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            {config.cancelText}
          </Button>
          <Button variant={config.variant} onClick={config.onConfirm}>
            {config.confirmText}
          </Button>
        </Modal.Footer>
      </Modal>
    </ConfirmationContext.Provider>
  );
};
