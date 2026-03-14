// Configuration for the 11-step account creation flow.
// Arabic strings are placeholders; replace with exact Figma copy if needed.
export interface AccountStepOption {
  id: string;
  labelKey: string; // i18n key
  description?: string; // optional description i18n key
  icon?: string; // placeholder for potential icon name
}

export interface AccountStep {
  key: string; // navigation state key e.g. account-1
  titleKey: string;
  centeredHeading?: boolean;
  subtitleKey?: string;
  descriptionKey?: string;
  options?: AccountStepOption[];
  multiSelect?: boolean;
  showProgress?: boolean;
  showBackButton?: boolean;
  type?: 'options' | 'timeline' | 'features' | 'summary' | 'recommendation' | 'allocation' | 'phone' | 'consent' | 'password' | 'otp' | 'success' | 'success-final' | 'identity' | 'bank' | 'bank-failure' | 'bank-success' | 'funding' | 'funding-review' | 'funding-success-modal';
  timelineSteps?: { index: number; titleKey: string; descriptionKey?: string; }[];
  features?: { icon: 'zap' | 'lock'; titleKey: string; descriptionKey: string; }[];
  portfolioOptions?: { id: string; titleKey: string; descriptionKey: string; }[];
  assetAllocation?: { id: string; labelKey: string; percentage: number; color: string; }[];
}

export const accountSteps: AccountStep[] = [
  {
    key: 'account-1',
    titleKey: 'createAccount.step1.title',
    subtitleKey: 'createAccount.step1.subtitle',
    options: [
      { id: 'guided', labelKey: 'createAccount.step1.option.guided', description: 'createAccount.step1.option.guidedDesc' },
      { id: 'manual', labelKey: 'createAccount.step1.option.manual', description: 'createAccount.step1.option.manualDesc' },
    ],
    showProgress: false,
    showBackButton: true,
    type: 'options'
  },
  {
    key: 'account-2',
    titleKey: 'createAccount.step2.title',
    subtitleKey: 'createAccount.step2.subtitle',
    timelineSteps: [
      { index: 1, titleKey: 'createAccount.step2.timeline.financial', descriptionKey: 'createAccount.step2.timeline.financialDesc' },
      { index: 2, titleKey: 'createAccount.step2.timeline.profile1', descriptionKey: 'createAccount.step2.timeline.profileDesc' },
      { index: 3, titleKey: 'createAccount.step2.timeline.profile2', descriptionKey: 'createAccount.step2.timeline.profileDesc' },
    ],
    showProgress: false,
    type: 'timeline'
  },
  {
    key: 'account-3',
    titleKey: 'createAccount.step3.title',
    features: [
      { icon: 'zap', titleKey: 'createAccount.step3.feature.fast', descriptionKey: 'createAccount.step3.feature.fastDesc' },
      { icon: 'lock', titleKey: 'createAccount.step3.feature.secure', descriptionKey: 'createAccount.step3.feature.secureDesc' },
    ],
    showProgress: false,
    type: 'features'
  },
  {
    key: 'account-4',
    titleKey: 'createAccount.step4.title',
    options: [
      { id: 'income', labelKey: 'createAccount.step4.option.income' },
      { id: 'retirement', labelKey: 'createAccount.step4.option.retirement' },
      { id: 'property', labelKey: 'createAccount.step4.option.property' },
      { id: 'progress', labelKey: 'createAccount.step4.option.progress' },
      { id: 'children', labelKey: 'createAccount.step4.option.children' },
      { id: 'other', labelKey: 'createAccount.step4.option.other' },
    ],
    showProgress: true,
    type: 'options'
  },
  {
    key: 'account-5',
    titleKey: 'createAccount.step5.title',
    options: [
      { id: 'lt1', labelKey: 'createAccount.step5.option.lt1' },
      { id: '1to3', labelKey: 'createAccount.step5.option.1to3' },
      { id: '3to5', labelKey: 'createAccount.step5.option.3to5' },
      { id: 'gt5', labelKey: 'createAccount.step5.option.gt5' },
    ],
    showProgress: true,
    type: 'options'
  },
  {
    key: 'account-6',
    titleKey: 'createAccount.step6.title',
    options: [
      { id: 'high', labelKey: 'createAccount.step6.option.high' },
      { id: 'medium', labelKey: 'createAccount.step6.option.medium' },
      { id: 'low', labelKey: 'createAccount.step6.option.low' },
    ],
    showProgress: true,
    type: 'options'
  },
  {
    key: 'account-7',
    titleKey: 'createAccount.step7.title',
    options: [
      { id: 'growth', labelKey: 'createAccount.step7.option.growth' },
      { id: 'preserve', labelKey: 'createAccount.step7.option.preserve' },
    ],
    showProgress: true,
    type: 'options'
  },
  {
    key: 'account-8',
    titleKey: 'createAccount.step8.title',
    options: [
      { id: 'immediate', labelKey: 'createAccount.step8.option.immediate' },
      { id: 'longterm', labelKey: 'createAccount.step8.option.longterm' },
    ],
    showProgress: true,
    type: 'options'
  },
  {
    key: 'account-9',
    centeredHeading: true,
    titleKey: 'createAccount.step9.title',
    subtitleKey: 'createAccount.step9.subtitle',
    type: 'recommendation',
    portfolioOptions: [
      { id: 'balanced', titleKey: 'createAccount.step9.portfolio.balanced', descriptionKey: 'createAccount.step9.portfolio.balancedDesc' },
    ],
    showProgress: false,
  },
  {
    key: 'account-10',
    titleKey: 'createAccount.step10.title',
    descriptionKey: 'createAccount.step10.description',
    type: 'allocation',
    assetAllocation: [
      { id: 'bonds', labelKey: 'createAccount.step10.asset.bonds', percentage: 75, color: '#10B981' },
      { id: 'stocks', labelKey: 'createAccount.step10.asset.stocks', percentage: 20, color: '#A795FE' },
      { id: 'gold', labelKey: 'createAccount.step10.asset.gold', percentage: 10, color: '#F59E0B' },
    ],
    showProgress: false,
  },
  {
    key: 'account-11',
    titleKey: 'createAccount.step11.title',
    subtitleKey: 'createAccount.step11.subtitle',
    type: 'timeline',
    timelineSteps: [
      { index: 1, titleKey: 'createAccount.step11.timeline.step1', descriptionKey: 'createAccount.step11.timeline.step1Desc' },
      { index: 2, titleKey: 'createAccount.step11.timeline.step2', descriptionKey: 'createAccount.step11.timeline.step2Desc' },
      { index: 3, titleKey: 'createAccount.step11.timeline.step3', descriptionKey: 'createAccount.step11.timeline.step3Desc' },
    ],
    showProgress: false,
  },
  {
    key: 'account-12',
    titleKey: 'createAccount.step12.title',
    subtitleKey: 'createAccount.step12.subtitle',
    type: 'phone',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-13',
    titleKey: 'createAccount.step13.title',
    subtitleKey: 'createAccount.step13.subtitle',
    type: 'password',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-14',
    titleKey: 'createAccount.step14.title',
    subtitleKey: 'createAccount.step14.subtitle',
    type: 'otp',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-15',
    titleKey: 'createAccount.step15.title',
    subtitleKey: 'createAccount.step15.subtitle',
    type: 'success',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-16',
    titleKey: 'createAccount.step16.title',
    subtitleKey: 'createAccount.step16.subtitle',
    type: 'success-final',
    showProgress: false,
    features: [
      { icon: 'zap', titleKey: 'createAccount.step16.feature1', descriptionKey: 'createAccount.step16.feature1Desc' },
      { icon: 'lock', titleKey: 'createAccount.step16.feature2', descriptionKey: 'createAccount.step16.feature2Desc' },
    ],
  },
  // New additional screens 17-20
  {
    key: 'account-17',
    titleKey: 'createAccount.step17.title',
    subtitleKey: 'createAccount.step17.subtitle',
    type: 'identity',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-18',
    titleKey: 'createAccount.step18.title',
    subtitleKey: 'createAccount.step18.subtitle',
    type: 'otp',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-19',
    titleKey: 'createAccount.step19.title',
    subtitleKey: 'createAccount.step19.subtitle',
    type: 'success',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-20',
    // Must reuse EXACT same copy as account-2
    titleKey: 'createAccount.step2.title',
    subtitleKey: 'createAccount.step2.subtitle',
    type: 'timeline',
    timelineSteps: [
      { index: 1, titleKey: 'createAccount.step2.timeline.financial', descriptionKey: 'createAccount.step2.timeline.financialDesc' },
      { index: 2, titleKey: 'createAccount.step2.timeline.profile1', descriptionKey: 'createAccount.step2.timeline.profileDesc' },
      { index: 3, titleKey: 'createAccount.step2.timeline.profile2', descriptionKey: 'createAccount.step2.timeline.profileDesc' },
    ],
    showProgress: false,
    centeredHeading: false,
  },
  {
    key: 'account-21',
    titleKey: 'createAccount.step21.title',
    subtitleKey: 'createAccount.step21.subtitle',
    type: 'bank',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-22',
    titleKey: 'createAccount.step22.title',
    subtitleKey: 'createAccount.step22.subtitle',
    type: 'otp',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-23',
    titleKey: 'createAccount.step23.title',
    subtitleKey: 'createAccount.step23.subtitle',
    type: 'bank-failure',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-24',
    titleKey: 'createAccount.step24.title',
    subtitleKey: 'createAccount.step24.subtitle',
    type: 'bank-success',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-25',
    titleKey: 'createAccount.step25.title',
    type: 'funding',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-26',
    titleKey: 'createAccount.step26.title',
    type: 'funding-review',
    showProgress: false,
    centeredHeading: true,
  },
  {
    key: 'account-27',
    titleKey: 'createAccount.step27.title',
    subtitleKey: 'createAccount.step27.subtitle',
    type: 'funding-success-modal',
    showProgress: false,
    centeredHeading: true,
  },
];
