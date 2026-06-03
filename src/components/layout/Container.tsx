import styled from 'styled-components'

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  padding: 0;
  width: calc(100% - 2rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: calc(100% - 1rem);
  }
`

export default Container
