import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

/**
 * Accessible confirmation modal component
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether the modal is visible
 * @param {Function} props.onHide - Function to call when the modal is closed
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {Function} props.onConfirm - Function to call when the user confirms
 * @param {string} props.confirmText - Text for the confirm button
 * @param {string} props.cancelText - Text for the cancel button
 * @returns {JSX.Element} - Rendered component
 */
const ConfirmationModal = ({ 
  show, 
  onHide, 
  title, 
  message, 
  onConfirm, 
  confirmText, 
  cancelText 
}) => {
  const { t } = useTranslation('common');

  // Use provided text or defaults from translations
  const confirmButtonText = confirmText || t('confirm');
  const cancelButtonText = cancelText || t('cancel');

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <Modal.Header closeButton>
        <Modal.Title id="confirmation-modal-title">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="confirmation-modal-description">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide}
          aria-label={cancelButtonText}
        >
          {cancelButtonText}
        </Button>
        <Button 
          variant="primary" 
          onClick={() => {
            onConfirm();
            onHide();
          }}
          aria-label={confirmButtonText}
        >
          {confirmButtonText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;