import styled, { css } from 'styled-components'

/**
 * `primary` er den rolige standarden (blekk). `accent` er terrakotta og skal
 * brukes sparsomt — som regel én gang per skjermbilde, på den handlingen vi
 * faktisk vil at brukeren skal gjøre.
 */
type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'social-fb' | 'social-ig'
type ButtonSize = 'sm' | 'md' | 'lg'

/** Felles løft. Mindre enn før (2px var nok til å skjelve), med varm skygge. */
const lift = css`
  &:hover {
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
    transition-duration: 0.05s;
  }
`

const variants = {
  primary: css`
    background-color: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};
    border: 1px solid transparent;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    &:hover {
      background-color: ${({ theme }) => theme.colors.neutral[800]};
      box-shadow: ${({ theme }) => theme.shadows.md};
    }
    ${lift}
  `,
  accent: css`
    background-color: ${({ theme }) => theme.colors.accent};
    color: #fff;
    border: 1px solid transparent;
    box-shadow: ${({ theme }) => theme.shadows.sm};
    &:hover {
      background-color: ${({ theme }) => theme.colors.accentHover};
      box-shadow: ${({ theme }) => theme.shadows.md};
    }
    ${lift}
  `,
  outline: css`
    background-color: transparent;
    color: ${({ theme }) => theme.colors.ink};
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    &:hover {
      border-color: ${({ theme }) => theme.colors.ink};
      background-color: ${({ theme }) => theme.colors.sunken};
    }
    ${lift}
  `,
  ghost: css`
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.28);
    color: #fff;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.45);
      box-shadow: ${({ theme }) => theme.shadows.onDark};
    }
    ${lift}
  `,
  'social-fb': css`
    color: ${({ theme }) => theme.colors.facebook};
    border: 1px solid ${({ theme }) => theme.colors.facebook};
    background: ${({ theme }) => theme.colors.surface};
    &:hover {
      background: ${({ theme }) => theme.colors.facebook};
      color: #fff;
    }
    ${lift}
  `,
  'social-ig': css`
    color: ${({ theme }) => theme.colors.instagram};
    border: 1px solid ${({ theme }) => theme.colors.instagram};
    background: ${({ theme }) => theme.colors.surface};
    &:hover {
      background: ${({ theme }) => theme.colors.instagram};
      color: #fff;
    }
    ${lift}
  `,
}

const sizes = {
  sm: css`
    padding: 0.5rem 0.9rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  `,
  md: css`
    padding: 0.75rem 1.35rem;
    font-size: ${({ theme }) => theme.fontSizes.base};
  `,
  lg: css`
    padding: 1rem 1.9rem;
    font-size: ${({ theme }) => theme.fontSizes.md};
  `,
}

const StyledButton = styled.button<{ $variant: ButtonVariant; $size: ButtonSize; $full: boolean }>`
  font-family: inherit;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  font-weight: 600;
  /* Setningsversaler, ikke uppercase — kortere å lese og mindre 2015. */
  letter-spacing: -0.005em;
  line-height: 1.2;
  transition:
    background-color ${({ theme }) => theme.transitions.default},
    border-color ${({ theme }) => theme.transitions.default},
    color ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  text-decoration: none;
  width: ${({ $full }) => ($full ? '100%' : 'auto')};
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  ${({ $size }) => sizes[$size]}
  ${({ $variant }) => variants[$variant]}
`

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

export default function Button({ variant = 'primary', size = 'md', fullWidth = false, children, ...props }: ButtonProps) {
  return (
    <StyledButton $variant={variant} $size={size} $full={fullWidth} {...props}>
      {children}
    </StyledButton>
  )
}
