import type { ReactNode } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'

/** Delte UI-primitiver for admin-panelet (felles utseende på tvers av sidene). */

export function AdminPageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <Head>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <HeadActions>{actions}</HeadActions>}
    </Head>
  )
}

const Head = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  h1 { margin: 0; font-size: 1.6rem; font-weight: 800; color: #16181d; letter-spacing: -0.01em; }
  p { margin: 0.25rem 0 0; font-size: 0.9rem; color: #6b6860; }
`

const HeadActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`

export const Card = styled.div`
  background: #fff;
  border: 1px solid #e7e5df;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`

export const Tabs = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`

export const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border: 1px solid ${({ $active }) => ($active ? '#16181d' : '#e0ddd5')};
  background: ${({ $active }) => ($active ? '#16181d' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#5a584f')};
  border-radius: 999px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  em { font-style: normal; opacity: 0.65; font-weight: 600; }
`

export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 4rem 1rem;
  color: #6b6860;
  font-weight: 600;
`

export const Empty = styled.div`
  text-align: center;
  color: #6b6860;
  background: #fff;
  border: 1px dashed #d9d6ce;
  border-radius: 14px;
  padding: 3rem 1.5rem;
  h2 { margin: 0 0 0.4rem; color: #16181d; font-size: 1.1rem; }
  p { margin: 0; }
`

/** KPI-kort til dashbordet. */
export function Stat({ label, value, icon, tone = 'default', onClick }: { label: string; value: ReactNode; icon: string; tone?: 'default' | 'green' | 'amber'; onClick?: () => void }) {
  return (
    <StatBox as={onClick ? 'button' : 'div'} $clickable={Boolean(onClick)} onClick={onClick}>
      <StatIcon className={`ico-${tone}`}><Icon name={icon} /></StatIcon>
      <div>
        <StatValue>{value}</StatValue>
        <StatLabel>{label}</StatLabel>
      </div>
    </StatBox>
  )
}

const StatBox = styled.div<{ $clickable: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1.1rem 1.2rem;
  background: #fff;
  border: 1px solid #e7e5df;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-align: left;
  font-family: inherit;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: transform 0.12s, box-shadow 0.15s;
  &:hover { ${({ $clickable }) => ($clickable ? 'transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.08);' : '')} }
`

const StatIcon = styled.span`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 1.05rem;
  background: #eef0e9;
  color: #33322e;
  &.ico-green { background: rgba(90, 143, 90, 0.14); color: #3f7a3f; }
  &.ico-amber { background: rgba(197, 149, 62, 0.16); color: #9a6c1e; }
`

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #16181d;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
`

const StatLabel = styled.div`
  font-size: 0.82rem;
  color: #6b6860;
  margin-top: 0.1rem;
`
