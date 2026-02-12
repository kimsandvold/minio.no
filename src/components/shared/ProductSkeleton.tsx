import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`

const SkeletonBlock = styled.div<{ $width?: string; $height?: string; $radius?: string }>`
  width: ${({ $width }) => $width || '100%'};
  height: ${({ $height }) => $height || '1rem'};
  border-radius: ${({ $radius }) => $radius || '4px'};
  background: linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
`

const CardSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2rem 0;
`

const GridCardSkeleton = styled.div`
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`

const GridCardBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FeaturedSkeleton = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem 0;
  margin-bottom: 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 2rem 0;
    margin-bottom: 0;
  }
`

const FeaturedInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const DetailSkeleton = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const DetailInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export function ProductCardSkeleton() {
  return (
    <CardSkeleton>
      <SkeletonBlock $height="200px" $radius="8px" />
      <SkeletonBlock $width="70%" $height="1.1rem" />
      <SkeletonBlock $height="0.9rem" />
      <SkeletonBlock $width="85%" $height="0.9rem" />
      <SkeletonBlock $width="40%" $height="1.5rem" />
    </CardSkeleton>
  )
}

export function ProductGridCardSkeleton() {
  return (
    <GridCardSkeleton>
      <SkeletonBlock $height="220px" $radius="0" />
      <GridCardBody>
        <SkeletonBlock $width="75%" $height="1rem" />
        <SkeletonBlock $height="0.88rem" />
        <SkeletonBlock $width="60%" $height="0.88rem" />
        <SkeletonBlock $width="40%" $height="1.2rem" />
      </GridCardBody>
    </GridCardSkeleton>
  )
}

export function FeaturedProductSkeleton() {
  return (
    <FeaturedSkeleton>
      <SkeletonBlock $height="350px" $radius="8px" />
      <FeaturedInfo>
        <SkeletonBlock $width="80%" $height="1.8rem" />
        <SkeletonBlock $height="1rem" />
        <SkeletonBlock $width="90%" $height="1rem" />
        <SkeletonBlock $width="50%" $height="1rem" />
        <SkeletonBlock $height="0.9rem" />
        <SkeletonBlock $width="85%" $height="0.9rem" />
        <SkeletonBlock $width="70%" $height="0.9rem" />
        <SkeletonBlock $width="40%" $height="1.6rem" />
        <SkeletonBlock $width="55%" $height="2.5rem" $radius="4px" />
      </FeaturedInfo>
    </FeaturedSkeleton>
  )
}

export function ProductDetailSkeleton() {
  return (
    <DetailSkeleton>
      <SkeletonBlock $height="400px" $radius="8px" />
      <DetailInfo>
        <SkeletonBlock $width="40%" $height="1.8rem" />
        <SkeletonBlock $width="30%" $height="0.9rem" />
        <SkeletonBlock $height="1rem" />
        <SkeletonBlock $width="90%" $height="1rem" />
        <SkeletonBlock $width="75%" $height="1rem" />
        <SkeletonBlock $height="1rem" />
        <SkeletonBlock $width="85%" $height="1rem" />
        <SkeletonBlock $width="60%" $height="1rem" />
        <SkeletonBlock $width="45%" $height="2.5rem" $radius="4px" />
      </DetailInfo>
    </DetailSkeleton>
  )
}
