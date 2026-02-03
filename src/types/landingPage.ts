// Landing Page Types

export type TargetType = 'INFLUENCER' | 'BUSINESS';

export interface LandingPageInput {
  targetType: TargetType;
  // Influencer fields
  name?: string;
  platform?: string;
  followers?: string;
  category?: string;
  strength?: string;
  // Business fields
  businessName?: string;
  description?: string;
  targetCustomer?: string;
  coreValue?: string;
  services?: string;
  // Common fields
  email?: string;
  instagram?: string;
  blog?: string;
  phone?: string;
}

export interface HeroSection {
  headline: string;
  subheadline: string;
  cta: string;
}

export interface StatItem {
  label: string;
  value: string;
  icon: string;
}

export interface PortfolioItem {
  title: string;
  description: string;
  result?: string;
  imageKeyword?: string;
}

export interface ContactInfo {
  email?: string;
  instagram?: string;
  blog?: string;
  phone?: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
}

export interface AIGeneratedContent {
  hero: HeroSection;
  stats: StatItem[];
  portfolio: PortfolioItem[];
  contact: ContactInfo;
  colorScheme: ColorScheme;
  imageKeywords: string[];
}

export interface LandingPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  target_type: TargetType;
  input_data: LandingPageInput;
  ai_generated_content: AIGeneratedContent;
  published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface LandingPageStore {
  inputData: LandingPageInput | null;
  generatedContent: AIGeneratedContent | null;
  isGenerating: boolean;
  previewMode: 'desktop' | 'mobile';
  currentLandingPage: LandingPage | null;
  
  setInputData: (data: LandingPageInput) => void;
  setGeneratedContent: (content: AIGeneratedContent) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  setCurrentLandingPage: (page: LandingPage | null) => void;
  resetBuilder: () => void;
}
