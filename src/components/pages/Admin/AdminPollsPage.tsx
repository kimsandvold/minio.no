import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import {
  getAllPolls,
  createPoll,
  updatePoll,
  deletePoll,
  type PollDoc,
} from '../../../services/pollAdminService'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import AdminPollForm from './AdminPollForm'

const Hero = styled.section`
  min-height: 20vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 15vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3rem 2rem 5rem;
  min-height: 50vh;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const TopBar = styled.div`
  display: flex;
  justify-content: flex-end;
`

const CreateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.85;
  }
`

const PollCardWrapper = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
`

const PollCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  gap: 1rem;

  &:hover {
    background: #fafafa;
  }
`

const PollInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const PollQuestion = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  color: #222;
  margin: 0 0 0.3rem;
`

const PollMeta = styled.div`
  font-size: 0.8rem;
  color: #888;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`

const StatusBadge = styled.span<{ $status: 'active' | 'planned' | 'ended' }>`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;

  ${({ $status }) =>
    $status === 'active'
      ? 'background: #dcfce7; color: #16a34a;'
      : $status === 'planned'
        ? 'background: #fef3c7; color: #d97706;'
        : 'background: #f1f5f9; color: #64748b;'}
`

const PollActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`

const IconBtn = styled.button`
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  color: #666;
  font-size: 0.85rem;
  transition: all 0.15s ease;

  &:hover {
    background: #f7f7f7;
    border-color: #ccc;
    color: #333;
  }
`

const DeleteBtn = styled(IconBtn)`
  &:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #dc2626;
  }
`

const ExpandedContent = styled.div`
  border-top: 1px solid #f0f0f0;
  padding: 1.25rem 1.5rem;
`

const ResultsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-width: 500px;
`

const ResultRow = styled.div``

const ResultLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.2rem;
  color: #333;
  font-weight: 500;
`

const BarTrack = styled.div`
  width: 100%;
  height: 22px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
`

const BarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: #4a5568;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: ${({ $pct }) => ($pct > 0 ? '4px' : '0')};
`

const TotalVotes = styled.p`
  font-size: 0.8rem;
  color: #999;
  margin: 0.75rem 0 0;
`

const OtherVotesList = styled.div`
  margin-top: 1rem;

  h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.4rem;
  }

  ul {
    list-style: disc;
    padding-left: 1.25rem;
    margin: 0;
  }

  li {
    font-size: 0.8rem;
    color: #666;
    line-height: 1.5;
  }
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const AccessDenied = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;

  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.5rem;
  }
`

function getPollStatus(poll: PollDoc): 'active' | 'planned' | 'ended' {
  const now = Date.now()
  const start = poll.startDate.toMillis()
  const end = poll.endDate.toMillis()
  if (now < start) return 'planned'
  if (now > end) return 'ended'
  return 'active'
}

const statusLabels = { active: 'Aktiv', planned: 'Planlagt', ended: 'Avsluttet' }

function formatDate(ts: { toDate: () => Date }) {
  return ts.toDate().toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminPollsPage() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuthContext()
  const navigate = useNavigate()
  const [polls, setPolls] = useState<PollDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'none' | 'create' | 'edit'>('none')
  const [editingPoll, setEditingPoll] = useState<PollDoc | undefined>()

  useSEO({
    title: 'Admin – Avstemninger – Minio',
    description: 'Administrer avstemninger.',
    noindex: true,
  })

  const loadPolls = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllPolls()
      setPolls(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isAdmin) {
      setLoading(false)
      return
    }
    loadPolls()
  }, [isAdmin, isAuthenticated, authLoading, loadPolls])

  const handleCreate = async (data: {
    question: string
    options: string[]
    startDate: Date
    endDate: Date
  }) => {
    await createPoll(data.question, data.options, data.startDate, data.endDate)
    setFormMode('none')
    await loadPolls()
  }

  const handleUpdate = async (data: {
    question: string
    options: string[]
    startDate: Date
    endDate: Date
  }) => {
    if (!editingPoll) return
    await updatePoll(editingPoll.id, data)
    setFormMode('none')
    setEditingPoll(undefined)
    await loadPolls()
  }

  const handleDelete = async (pollId: string) => {
    if (!window.confirm('Er du sikker pa at du vil slette denne avstemningen?')) return
    await deletePoll(pollId)
    await loadPolls()
  }

  if (!authLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <>
        <Navbar />
        <PageTransition>
          <main>
            <Hero>
              <HeroContent>
                <h1>Admin</h1>
              </HeroContent>
            </Hero>
            <Content>
              <Container>
                <AccessDenied>
                  <h2>Ingen tilgang</h2>
                  <p>Du har ikke tilgang til denne siden.</p>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      background: '#1a1a1a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    Ga til forsiden
                  </button>
                </AccessDenied>
              </Container>
            </Content>
          </main>
        </PageTransition>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>Avstemninger</h1>
              <p>Opprett og administrer avstemninger.</p>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              {loading ? (
                <LoadingState>
                  <Icon name="faSpinner" spin /> Laster avstemninger...
                </LoadingState>
              ) : (
                <>
                  <TopBar>
                    {formMode === 'none' && (
                      <CreateBtn onClick={() => setFormMode('create')}>
                        <Icon name="faPlus" /> Opprett ny avstemning
                      </CreateBtn>
                    )}
                  </TopBar>

                  {formMode !== 'none' && (
                    <AdminPollForm
                      poll={formMode === 'edit' ? editingPoll : undefined}
                      onSubmit={formMode === 'create' ? handleCreate : handleUpdate}
                      onCancel={() => {
                        setFormMode('none')
                        setEditingPoll(undefined)
                      }}
                    />
                  )}

                  {polls.length === 0 && formMode === 'none' ? (
                    <EmptyState>Ingen avstemninger opprettet enna.</EmptyState>
                  ) : (
                    polls.map((poll) => {
                      const status = getPollStatus(poll)
                      const totalVotes = Object.values(poll.votes).reduce(
                        (a, b) => a + b,
                        0,
                      )
                      const isExpanded = expandedId === poll.id

                      return (
                        <PollCardWrapper key={poll.id}>
                          <PollCardHeader
                            onClick={() =>
                              setExpandedId(isExpanded ? null : poll.id)
                            }
                          >
                            <PollInfo>
                              <PollQuestion>{poll.question}</PollQuestion>
                              <PollMeta>
                                <StatusBadge $status={status}>
                                  {statusLabels[status]}
                                </StatusBadge>
                                <span>
                                  {formatDate(poll.startDate)} –{' '}
                                  {formatDate(poll.endDate)}
                                </span>
                                <span>{totalVotes} stemmer</span>
                              </PollMeta>
                            </PollInfo>
                            <PollActions>
                              <IconBtn
                                title="Rediger"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingPoll(poll)
                                  setFormMode('edit')
                                }}
                              >
                                <Icon name="faPencilRuler" />
                              </IconBtn>
                              <DeleteBtn
                                title="Slett"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(poll.id)
                                }}
                              >
                                <Icon name="faTrash" />
                              </DeleteBtn>
                              <IconBtn>
                                <Icon
                                  name={isExpanded ? 'faChevronUp' : 'faChevronDown'}
                                />
                              </IconBtn>
                            </PollActions>
                          </PollCardHeader>

                          {isExpanded && (
                            <ExpandedContent>
                              <ResultsGrid>
                                {poll.options.map((opt) => {
                                  const count = poll.votes[opt] || 0
                                  const pct =
                                    totalVotes > 0
                                      ? Math.round((count / totalVotes) * 100)
                                      : 0
                                  return (
                                    <ResultRow key={opt}>
                                      <ResultLabel>
                                        <span>{opt}</span>
                                        <span>
                                          {count} ({pct}%)
                                        </span>
                                      </ResultLabel>
                                      <BarTrack>
                                        <BarFill $pct={pct} />
                                      </BarTrack>
                                    </ResultRow>
                                  )
                                })}
                              </ResultsGrid>
                              <TotalVotes>
                                {totalVotes} stemme{totalVotes !== 1 ? 'r' : ''} totalt
                              </TotalVotes>
                              {poll.otherVotes && poll.otherVotes.length > 0 && (
                                <OtherVotesList>
                                  <h4>Annet-forslag:</h4>
                                  <ul>
                                    {poll.otherVotes.map((text, i) => (
                                      <li key={i}>{text}</li>
                                    ))}
                                  </ul>
                                </OtherVotesList>
                              )}
                            </ExpandedContent>
                          )}
                        </PollCardWrapper>
                      )
                    })
                  )}
                </>
              )}
            </Container>
          </Content>
        </main>
      </PageTransition>
      <Footer />
    </>
  )
}
