export interface Campaign {
  id: number
  title: string
  description: string | null
  platform: string
  type: string
  category: string
  thumbnail_url: string | null
  recruit_count: number
  end_date: string
  status: string
  created_at: string
  store_name: string | null
  store_address: string | null
  naver_map_url: string | null
  sub_image_1: string | null
  sub_image_2: string | null
  is_always: boolean | null
  campaign_options: string[] | null
  provision: string | null
  region: string | null
  business_hours: string | null
  available_time: string | null
  reservation_method: string | null
  created_by: string | null
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

