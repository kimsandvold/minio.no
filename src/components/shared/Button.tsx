import styled, { css } from 'styled-components'

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'social-fb' | 'social-ig'

const variants = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    border: 0;
    &:hover {
      background-color: #333;
      transform: translateY(-2px);
    }
    &:active {
      transform: translateY(0);
    }
  `,
  outline: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.textDark};
    border: 2px solid ${({ theme }) => theme.colors.textDark};
    &:hover {
      background-color: ${({ theme }) => theme.colors.textDark};
      color: #fff;
      transform: translateY(-2px);
    }
    &:active {
      transform: translateY(0);
    }
  `,
  ghost: css`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }
    &:active {
      transform: translateY(0);
    }
  `,
  'social-fb': css`
    color: #3b5998;
    border: 2px solid #3b5998;
    background: #fff;
    &:hover {
      background: #3b5998;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 89, 152, 0.3);
    }
    &:active {
      transform: translateY(0);
    }
  `,
  'social-ig': css`
    color: #e4405f;
    border: 2px solid #e4405f;
    background: #fff;
    &:hover {
      background: #e4405f;
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(228, 64, 95, 0.3);
    }
    &:active {
      transform: translateY(0);
    }
  `,
}

const StyledButton = styled.button<{ $variant: ButtonVariant }>`
  padding: 0.9rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all ${({ theme }) => theme.transitions.default};
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: none;
  text-decoration: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  touch-action: manipulation;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
  ${({ $variant }) => variants[$variant]}
`

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export default function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  return <StyledButton $variant={variant} {...props}>{children}</StyledButton>
}
