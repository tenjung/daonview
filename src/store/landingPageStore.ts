import { create } from 'zustand';
import { LandingPageStore, LandingPageInput, AIGeneratedContent, LandingPage } from '@/types/landingPage';

export const useLandingPageStore = create<LandingPageStore>((set) => ({
  inputData: null,
  generatedContent: null,
  isGenerating: false,
  previewMode: 'desktop',
  currentLandingPage: null,

  setInputData: (data: LandingPageInput) => set({ inputData: data }),
  
  setGeneratedContent: (content: AIGeneratedContent) => set({ generatedContent: content }),
  
  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),
  
  setPreviewMode: (mode: 'desktop' | 'mobile') => set({ previewMode: mode }),
  
  setCurrentLandingPage: (page: LandingPage | null) => set({ currentLandingPage: page }),
  
  resetBuilder: () => set({
    inputData: null,
    generatedContent: null,
    isGenerating: false,
    previewMode: 'desktop',
    currentLandingPage: null,
  }),
}));
