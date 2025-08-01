// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
      <style jsx>{`
        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          font-weight: bold;
          transition: background-color 0.3s ease, transform 0.1s ease;
          width: 100%;
          text-align: center;
        }
        .primary {
          background-color: var(--primary-gold);
          color: var(--text-dark);
        }
        .primary:hover {
          background-color: var(--button-hover);
        }
        .secondary {
          background-color: #6c757d;
          color: var(--text-light);
        }
        .secondary:hover {
          background-color: #5a6268;
        }
        .danger {
          background-color: var(--error-red);
          color: var(--text-light);
        }
        .danger:hover {
          background-color: #c82333;
        }
        .button:disabled {
          background-color: #6a6a6a;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .button:active {
          transform: translateY(1px);
        }
      `}</style>
    </button>
  );
};

export default Button;
