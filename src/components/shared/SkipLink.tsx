import styled from 'styled-components'

const StyledSkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;

  &:focus {
    top: 0;
  }
`

export default function SkipLink() {
  return <StyledSkipLink href="#main-content">Hopp til hovedinnhold</StyledSkipLink>
}
