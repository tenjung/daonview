export interface Campaign {
  id: number
  created_by: string | null
  title: string
  description: string | null
  
  // 분류 (유저 정의 구조 반영)
  type: string      // '방문형', '배송형'
  platform: string  // '블로그', '인스타', '기타'
  campaign_type: string // 'delivery', 'visit', 'press' (내부 구분용)
  
  category: string | null
  region: string | null
  
  // 이미지
  thumbnail_url: string | null
  sub_image_1: string | null
  sub_image_2: string | null
  campaign_images: string[] | null
  
  // 모집 정보
  recruit_count: number
  total_recruitment: number
  recruitment_start_date: string | null
  first_selection_date: string | null
  review_deadline: string | null
  end_date: string
  
  // 상태 및 설정
  status: string
  created_at: string
  
  // 매장 및 제공 정보
  store_name: string | null
  store_address: string | null
  naver_map_url: string | null
  stores: any[] | null
  provision: string | null
  experience_details: string | null
  official_price: string | null
  
  // 연락 및 방문 정보
  contact_phone: string | null
  visit_time: string | null
  visit_days: string[] | null
  visit_notes: string | null
  
  // 배송체험단/구매평 전용 정보
  product_url: string | null
  product_url_private: boolean | null
  product_name: string | null
  product_price: string | null
  product_options: any[] | null
  reward_per_person: number | null
  
  // 리뷰 가이드 정보
  text_length: string | null
  photo_count: string | null
  video_required: string | null
  mission_guide: string | null
  keywords: string[] | null
  prohibited_words: string[] | null
  additional_notes: string | null
  payment_method: string | null
}

export interface Profile {
  id: string
  email: string
  nickname: string
  point: number
  role: string
  created_at: string
  company_name: string | null
  biz_number: string | null
  sns_url: string | null
  phone_number: string | null
}

export interface Application {
  id: number
  user_id: string
  campaign_id: number
  status: string
  created_at: string
}

export interface Favorite {
  id: number
  user_id: string
  campaign_id: number
  created_at: string
}

export interface Banner {
  id: number
  title: string
  subtitle: string
  image_url: string
  link_url: string
  display_order: number
  is_active: boolean
  created_at: string
}

export interface Notice {
  id: number
  type: string // '공지', '이벤트', '업데이트'
  title: string
  content: string | null
  author_id: string | null
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  key: string
  value: any // JSONB type
  updated_at: string
}
