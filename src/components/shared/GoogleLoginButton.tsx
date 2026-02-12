import { useGoogleLogin } from '@react-oauth/google'
import styled from 'styled-components'
import { useAuthContext } from '../../context/AuthContext'
import type { GoogleUser } from '../../types/auth'
import Icon from './Icon'

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

export default function GoogleLoginButton() {
  const { login } = useAuthContext()

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      })
      const userInfo: GoogleUser = await res.json()
      login(userInfo)
    },
  })

  return (
    <Button onClick={() => googleLogin()} type="button">
      <Icon name="faGoogle" />
      Logg inn med Google
    </Button>
  )
}
