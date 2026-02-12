import { keyframes } from 'styled-components'

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`

export const modalSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

export const heroZoom = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
`

export const promoPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(29, 161, 242, 0.4);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(29, 161, 242, 0.2);
  }
`
