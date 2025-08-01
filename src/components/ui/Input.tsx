// src/components/ui/Input.tsx
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input className={`input ${className}`} {...props} />
      <style jsx>{`
        .input-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-light);
          font-size: 0.9em;
        }
        .input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border-gray);
          border-radius: 5px;
          background-color: #3a3a3a;
          color: var(--text-light);
          font-size: 1em;
          box-sizing: border-box; /* Garante que padding não aumente a largura */
        }
        .input:focus {
          outline: none;
          border-color: var(--primary-gold);
          box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
        }
        .input::placeholder {
          color: #888;
        }
      `}</style>
    </div>
  );
};

export default Input;
