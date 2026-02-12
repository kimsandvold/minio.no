import styled from 'styled-components'

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  padding: 0 2rem;
  width: 100%;

  @media (max-width: 1200px) {
    padding: 0 1.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1rem;
  }
`

export default Container
