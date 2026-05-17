import { useState } from "react";
import PropTypes from "prop-types";
import ConfirmModal from "./ConfirmModal";

/**
 * DeleteButton — renders a red "Delete" button that shows a confirmation modal before firing onConfirm.
 */
export const DeleteButton = ({
  onConfirm,
  label = "Delete",
  title = "Delete",
  message = "Are you sure you want to delete this? This action cannot be undone.",
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {label}
      </button>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        title={title}
        message={message}
        type="delete"
      />
    </>
  );
};

DeleteButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  label: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

/**
 * EditButton — renders an "Edit" button. Optionally shows a confirmation modal before firing onConfirm.
 * Pass requireConfirm=true to show the modal; omit it to call onConfirm directly.
 */
export const EditButton = ({
  onConfirm,
  label = "Edit",
  title = "Confirm Update",
  message = "Are you sure you want to update this record?",
  requireConfirm = false,
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (requireConfirm) {
      setOpen(true);
    } else {
      onConfirm();
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {label}
      </button>
      {requireConfirm && (
        <ConfirmModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onConfirm={onConfirm}
          title={title}
          message={message}
          type="update"
        />
      )}
    </>
  );
};

EditButton.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  label: PropTypes.string,
  title: PropTypes.string,
  message: PropTypes.string,
  requireConfirm: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
