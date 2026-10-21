export const site = {
  name: 'WhiteScreen Studio',
  url: (import.meta.env.VITE_SITE_URL || 'https://whitescreen-studio-nain.nain1997.chatgpt.site').replace(/\/$/,''),
  owner: import.meta.env.VITE_SITE_OWNER || 'WhiteScreen Studio',
  contact: import.meta.env.VITE_CONTACT_EMAIL || '',
  indexable: import.meta.env.VITE_PUBLIC_INDEXING !== 'false',
  updated: '2026-10-19',
  adsEnabled: import.meta.env.VITE_ADSENSE_ENABLED === 'true',
  adClient: import.meta.env.VITE_ADSENSE_CLIENT || '',
  adSlot: import.meta.env.VITE_ADSENSE_SLOT || '',
  cmpScript: import.meta.env.VITE_CMP_SCRIPT_URL || '',
};
