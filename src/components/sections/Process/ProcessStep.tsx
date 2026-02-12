import styled from 'styled-components'
import Icon from '../../shared/Icon'
import type { ProcessStepData } from '../../../types/product'

const Step = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 40px 1fr;
    gap: 1rem;
  }
`

const StepIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.textDark};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
`

const StepContent = styled.div`
  h3 {
    font-size: 1.4rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.75rem;
    margin-top: 0;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.2rem;
    }
  }

  p {
    font-size: 1rem;
    line-height: 1.7;
    color: #555;
    margin: 0;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 0.95rem;
    }
  }
`

interface ProcessStepProps {
  step: ProcessStepData
}

export default function ProcessStep({ step }: ProcessStepProps) {
  return (
    <Step>
      <StepIcon>
        <Icon name={step.icon} />
      </StepIcon>
      <StepContent>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
      </StepContent>
    </Step>
  )
}
