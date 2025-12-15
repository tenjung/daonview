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

