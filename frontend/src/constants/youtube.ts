// YouTube Data API v3 카테고리 상수
export const YOUTUBE_CATEGORIES = [
  { id: '1', name: '영화 및 애니메이션', en: 'Film & Animation' },
  { id: '2', name: '자동차 및 교통수단', en: 'Autos & Vehicles' },
  { id: '10', name: '음악', en: 'Music' },
  { id: '15', name: '반려동물 및 동물', en: 'Pets & Animals' },
  { id: '17', name: '스포츠', en: 'Sports' },
  { id: '19', name: '여행 및 이벤트', en: 'Travel & Events' },
  { id: '20', name: '게임', en: 'Gaming' },
  { id: '22', name: '사람 및 블로그', en: 'People & Blogs' },
  { id: '23', name: '코미디', en: 'Comedy' },
  { id: '24', name: '엔터테인먼트', en: 'Entertainment' },
  { id: '25', name: '뉴스 및 정치', en: 'News & Politics' },
  { id: '26', name: '노하우 및 스타일', en: 'Howto & Style' },
  { id: '27', name: '교육', en: 'Education' },
  { id: '28', name: '과학 및 기술', en: 'Science & Technology' },
  { id: '29', name: '비영리 및 사회운동', en: 'Nonprofits & Activism' }
] as const

// 기본 카테고리 ID (엔터테인먼트)
export const DEFAULT_CATEGORY_ID = '24'

// 카테고리 ID로 카테고리 정보를 찾는 함수
export const getCategoryById = (id: string) => {
  return YOUTUBE_CATEGORIES.find(category => category.id === id)
}

// 한국 시니어 콘텐츠에 적합한 추천 카테고리들
export const RECOMMENDED_CATEGORIES_FOR_SENIORS = [
  '24', // 엔터테인먼트
  '22', // 사람 및 블로그
  '27', // 교육
  '26', // 노하우 및 스타일
  '15', // 반려동물 및 동물
  '19', // 여행 및 이벤트
] as const