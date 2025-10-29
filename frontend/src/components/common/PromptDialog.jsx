import React, { useState, useEffect } from 'react';

const PromptDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  placeholder = '',
  defaultValue = ''
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue('');
  };

  const handleCancel = () => {
    onCancel();
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          {message && <p>{message}</p>}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
            className="prompt-input"
          />
        </div>
        <div className="modal-footer">
          <button onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn btn-primary">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptDialog;

