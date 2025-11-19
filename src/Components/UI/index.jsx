/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-7xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const StepProgress = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <button
              onClick={() => onStepClick(index)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                index === currentStep
                  ? "bg-blue-600 text-white"
                  : index < currentStep
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {index < currentStep ? "✓" : index + 1}
            </button>
            <span
              className={`ml-2 text-sm font-medium ${
                index === currentStep
                  ? "text-blue-600 dark:text-blue-400"
                  : index < currentStep
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-px mx-4 ${
                  index < currentStep
                    ? "bg-green-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const FormField = ({ label, error, required, children, className = "" }) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  className = "",
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
        error
          ? "border-red-300 dark:border-red-600"
          : "border-gray-300 dark:border-gray-600"
      } ${className}`}
      {...props}
    />
  );
};

const Textarea = ({
  placeholder,
  value,
  onChange,
  error,
  rows = 3,
  className = "",
  ...props
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical ${
        error
          ? "border-red-300 dark:border-red-600"
          : "border-gray-300 dark:border-gray-600"
      } ${className}`}
      {...props}
    />
  );
};

const Select = ({
  value,
  onChange,
  options = [],
  placeholder,
  error,
  className = "",
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
        error
          ? "border-red-300 dark:border-red-600"
          : "border-gray-300 dark:border-gray-600"
      } ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const Switch = ({ checked, onChange, label, className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {label && (
        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </div>
  );
};

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) => {
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    outline:
      "border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export {
  Modal,
  StepProgress,
  FormField,
  Input,
  Textarea,
  Select,
  Switch,
  Button,
};
