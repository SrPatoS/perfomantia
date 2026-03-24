import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
     padding: '0.6rem 1.2rem',
     borderRadius: '8px',
     fontWeight: 500,
     fontSize: '0.875rem',
     cursor: 'pointer',
     transition: 'all 0.2s ease',
     border: '1px solid rgba(255, 255, 255, 0.05)',
     display: 'inline-flex',
     alignItems: 'center',
     justifyContent: 'center',
     gap: '0.5rem',
     outline: 'none',
  };

  const variants = {
     primary: {
        background: '#0284c7', // Flat clean sky blue
        color: '#ffffff',
        border: 'none',
     },
     secondary: {
        background: 'rgba(255, 255, 255, 0.04)',
        color: '#e2e8f0',
     },
     danger: {
        background: '#dc2626',
        color: '#ffffff',
        border: 'none',
     }
  };

  const currentVariant = variants[variant] || variants.primary;

  return (
     <button 
       style={{ ...baseStyle, ...currentVariant, ...style }} 
       onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.1)';
       }}
       onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)';
       }}
       {...props}
     >
       {children}
     </button>
  );
}
