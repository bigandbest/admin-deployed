import PropTypes from "prop-types";

/**
 * Reusable confirmation modal for delete and update actions.
 * type="delete"  → red confirm button
 * type="update"  → yellow/amber confirm button
 */
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel, type = "delete" }) => {
  if (!isOpen) return null;

  const isDelete = type === "delete";

  return (
    <div className="fixed inset-0 bg-gray-600/40 flex items-center justify-center z-[200]" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="flex items-center space-x-3 mb-3">
          <div className={`p-2 rounded-full ${isDelete ? "bg-red-100" : "bg-amber-100"}`}>
            <span className="text-xl">{isDelete ? "🗑️" : "✏️"}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isDelete
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {confirmLabel || (isDelete ? "Delete" : "Confirm Update")}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  type: PropTypes.oneOf(["delete", "update"]),
};

export default ConfirmModal;
