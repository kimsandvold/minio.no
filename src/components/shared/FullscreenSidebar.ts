import styled from 'styled-components'

export const SidebarPanel = styled.div`
  width: 340px;
  height: 100%;
  background: #111;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  overflow-y: auto;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 280px;
  }
`

export const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  background: #111;
  z-index: 1;
`

export const SidebarTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
`

export const SidebarClose = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #7a6f61;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`

export const SidebarBody = styled.div`
  padding: 1.25rem;
`

export const SbSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

export const SbLabel = styled.div`
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #5a5249;
  margin-bottom: 0.6rem;
  font-weight: 600;
`

export const SbSliderGroup = styled.div`
  margin-bottom: 0.85rem;

  &:last-child {
    margin-bottom: 0;
  }
`

export const SbSliderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
`

export const SbSliderName = styled.span`
  font-size: 0.78rem;
  color: #7a6f61;
`

export const SbSliderVal = styled.span`
  font-size: 0.78rem;
  color: #fff;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`

export const SbSlider = styled.input`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #2e2a26;
  outline: none;
  appearance: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
  }
`

export const SegRow = styled.div`
  display: flex;
  background: #1c1a18;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
`

export const SegBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 7px 6px;
  border-radius: 6px;
  border: none;
  background: ${({ $active }) => ($active ? '#2e2a26' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#6b6157')};
  font-size: 0.72rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: ${({ $active }) => ($active ? '#fff' : '#7a6f61')};
  }
`

export const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0.4rem 0;
`

export const ToggleText = styled.span`
  font-size: 0.78rem;
  color: #7a6f61;
`

export const ToggleTrack = styled.span<{ $on: boolean }>`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${({ $on }) => ($on ? '#3b82f6' : '#2e2a26')};
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '18px' : '2px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.2s ease;
  }
`
