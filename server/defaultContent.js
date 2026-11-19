// Default website content. After first run it is copied to server/data/content.json,
// which is what the Admin panel (/admin) edits. Delete that file to reset to these defaults.
export default {
  brand: {
    name: 'Remso Media',
    tagline: 'Connecting brands with the right creators',
    logo: '/logo.png'
  },
  contact: {
    phone: '+91 93516 41459',
    whatsapp: '919351641459',
    email: 'support@remsmedia.com',
    address: 'India — Pan-India Operations',
    mapLink: '',
    instagram: 'https://instagram.com/',
    linkedin: 'https://linkedin.com/',
    youtube: 'https://youtube.com/'
  },
  hero: {
    eyebrow: '4 years of creator-led growth for Indian brands',
    title: 'We turn creators into your brand’s',
    rotating: ['growth engine', 'sales machine', 'loudest voice', 'reach multiplier'],
    subtitle:
      '10,000+ influencers across every state, language and category. We connect your brand with the right creators — and deliver real views, real students, real sales.',
    ctaPrimary: 'Start a campaign',
    ctaSecondary: 'See our work',
    chips: [
      { t: '20M+ views', s: 'for a single brand' },
      { t: '10,000+', s: 'creators across India' },
      { t: '4+ years', s: 'of experience' }
    ]
  },
  stats: [
    { value: 10000, suffix: '+', label: 'Influencers & creators' },
    { value: 70, suffix: '+', label: 'Brands served across India' },
    { value: 4, suffix: '+', label: 'Years of experience' },
    { value: 20, suffix: 'M+', label: 'Views delivered for one brand' }
  ],
  brandsStrip: ['Allen', 'Mamaearth', 'Plix', 'Nat Habit', 'Beco', 'Muchstac', 'Prince', 'Park Avenue', 'Flipkart', 'Amazon', 'Zepto', 'Blinkit', 'Rapido'],
  connect: {
    eyebrow: 'Our approach',
    title: 'Connecting brands with the right creators.',
    text: 'Anyone can find an influencer by price. We find the one who fits — by audience, language, city and category — so every rupee of your budget works harder.',
    labels: { brands: 'Brands', hub: 'Remso Media', creators: 'Right creators' },
    points: ['Right audience, not just right price', 'Matched by state, language & category', 'One team managing every creator']
  },
  creators: {
    eyebrow: 'Our creator network',
    title: 'One network. Every voice India listens to.',
    text: 'We have 10,000+ influencers and creators across India, covering every state, language and category — so your message always finds the right audience, in the right language.',
    categories: [
      { icon: '✨', name: 'Lifestyle Creators' },
      { icon: '💄', name: 'Beauty & Fashion' },
      { icon: '🍼', name: 'Mom & Baby Influencers' },
      { icon: '🎬', name: 'Entertainment' },
      { icon: '🗣️', name: 'Regional (Language & Local Creators)' },
      { icon: '✈️', name: 'Travel' },
      { icon: '💻', name: 'Tech' },
      { icon: '📈', name: 'Finance & Business' },
      { icon: '🏠', name: 'Real Estate' },
      { icon: '🎓', name: 'Education' },
      { icon: '📰', name: 'News' }
    ],
    regions: [
      { name: 'South', note: 'Karnataka, Tamil Nadu, Kerala, Telangana, Andhra Pradesh' },
      { name: 'North', note: 'Delhi NCR, Punjab, Haryana, Rajasthan, UP, Uttarakhand, J&K' },
      { name: 'East', note: 'West Bengal, Odisha, Bihar, Jharkhand' },
      { name: 'North East', note: 'Assam and the seven sister states' }
    ],
    tiers: [
      { name: 'Nano', size: '1K – 10K', note: 'Community trust' },
      { name: 'Micro', size: '10K – 100K', note: 'Niche engagement' },
      { name: 'Macro', size: '100K – 1M', note: 'Scalable reach' },
      { name: 'Mega', size: '1M+', note: 'Large-scale awareness' },
      { name: 'Celebrity', size: 'Star power', note: 'Celebrity visibility' }
    ]
  },
  spotlight: {
    eyebrow: 'Creator spotlight',
    title: 'The kind of voices we put behind your brand.',
    note: 'Illustrative profiles to show the range of our network.',
    items: [
      { name: 'Ananya', category: 'Beauty & Fashion', tier: 'Micro', platform: 'Instagram', skin: '#e8b48c', hair: '#1b1210', top: '#d9467a', style: 'long', extras: 'bindi' },
      { name: 'Rohan', category: 'Tech', tier: 'Macro', platform: 'YouTube', skin: '#d9a07a', hair: '#15110f', top: '#2b6cb0', style: 'short', extras: 'glasses' },
      { name: 'Meera', category: 'Mom & Baby', tier: 'Nano', platform: 'Instagram', skin: '#ecc19c', hair: '#2a1a14', top: '#2e9c86', style: 'bun', extras: '' },
      { name: 'Arjun', category: 'Travel', tier: 'Mega', platform: 'YouTube', skin: '#c98d64', hair: '#0f0c0b', top: '#e08a1e', style: 'cap', extras: 'beard' },
      { name: 'Lakshmi', category: 'Regional · Tamil', tier: 'Micro', platform: 'Instagram', skin: '#b87850', hair: '#120d0b', top: '#8a2be2', style: 'long', extras: 'bindi' },
      { name: 'Imran', category: 'Finance & Business', tier: 'Macro', platform: 'LinkedIn', skin: '#d4996f', hair: '#17110e', top: '#1f3b4d', style: 'short', extras: 'beard,glasses' },
      { name: 'Simran', category: 'Entertainment', tier: 'Mega', platform: 'Instagram', skin: '#efc6a4', hair: '#33201a', top: '#e0527a', style: 'curly', extras: '' },
      { name: 'Deepak', category: 'Education', tier: 'Micro', platform: 'YouTube', skin: '#cf9468', hair: '#100c0a', top: '#136b57', style: 'short', extras: 'glasses' }
    ]
  },
  work: {
    eyebrow: 'Portfolio',
    title: 'Results that speak louder than reach.',
    text: 'A few of the brands we have grown with influencer-led campaigns.',
    items: [
      { brand: 'Allen', tag: 'Brand Awareness', metric: '20M+', metricLabel: 'views counted', text: 'A brand-awareness campaign for Allen that crossed 20 million views.' },
      { brand: 'Nat Habit', tag: 'Views & Conversion', metric: '30M+', metricLabel: 'views & conversions', text: 'Working continuously for the last 6 months, driving 30 million+ views and conversions.' },
      { brand: 'Ghar Soaps', tag: 'Always-on Programme', metric: '20M', metricLabel: 'views every month', text: 'Working with Ghar Soaps for the last 1 year with 200+ influencers every month, delivering around 20 million views per month.' },
      { brand: 'Prince', tag: 'Education · Admissions', metric: '350', metricLabel: 'students enrolled', text: 'Influencer-led lead generation that brought in 350 students.' },
      { brand: 'Muchstac', tag: 'Views, Sales & Conversion', metric: 'Sales', metricLabel: 'driven by creators', text: 'Good views, sales and conversions delivered through influencer campaigns.' },
      { brand: 'Beco', tag: 'Influencer Campaign', metric: 'Beco', metricLabel: 'sustainable lifestyle brand', text: 'Creator-led campaigns for a conscious, sustainable-living brand.' }
    ]
  },
  proof: {
    eyebrow: 'Creators in action',
    title: 'Real creators. Real reels. Real engagement.',
    text: 'A look at creators who have promoted Ghar Soaps through our campaigns.',
    brand: 'Ghar Soaps',
    items: [
      { handle: 'dharmendra_bilotia_', name: 'Dharmendra Bilotia', niche: 'Lifestyle & trends', stat: '39.3K', statLabel: 'likes on the reel', verified: true, skin: '#c98d64', hair: '#0f0c0b', top: '#3a4a44', style: 'short', extras: 'beard' },
      { handle: 'sannumunnu_', name: 'Sannu Munnu', niche: 'Couple & family vlogs', stat: '25K', statLabel: 'likes on the reel', verified: true, skin: '#e0ab83', hair: '#2a1a14', top: '#e8e4f0', style: 'long', extras: '' },
      { handle: 'lata_bhakar_0077', name: 'Lata Bhakar', niche: 'Regional · Rajasthan', stat: '53.6K', statLabel: 'likes on the reel', verified: true, skin: '#d4996f', hair: '#120d0b', top: '#9c1f2e', style: 'long', extras: 'bindi' }
    ],
    note: 'Creator names, handles and numbers are public. Avatars are illustrations.'
  },
  topCreators: {
    eyebrow: 'Our creators',
    title: 'Meet some of the creators behind our campaigns.',
    text: 'A few of the 10,000+ creators in our network. Tap any card to see their Instagram.',
    note: 'Avatars are illustrations. Tap a card to open the creator’s real Instagram profile.',
    items: [
      { name: 'Aastha Soni', handle: 'aasthaa.6', city: '', skin: '#e8b48c', hair: '#1b1210', top: '#d9467a', style: 'long', extras: 'bindi' },
      { name: 'Lata Bhakar', handle: 'lata_bhakar_0077', city: '', skin: '#d9a07a', hair: '#15110f', top: '#2b6cb0', style: 'bun', extras: '' },
      { name: 'Dimple Bishnoi', handle: 'dimple_bishnoi_7', city: '', skin: '#ecc19c', hair: '#2a1a14', top: '#2e9c86', style: 'curly', extras: '' },
      { name: 'Mahi Patel', handle: 'mahipatel_official_', city: '', skin: '#c98d64', hair: '#0f0c0b', top: '#e08a1e', style: 'long', extras: 'bindi' },
      { name: 'Tijara Vines', handle: 'tijara_vines01', city: '', skin: '#d4996f', hair: '#33201a', top: '#8a2be2', style: 'short', extras: 'beard' },
      { name: 'Manisha Swami', handle: 'funnymaniiiii', city: '', skin: '#e0ab83', hair: '#1b1210', top: '#1f3b4d', style: 'bun', extras: '' },
      { name: 'Akhil', handle: 'akhil_nrd', city: '', skin: '#b87850', hair: '#15110f', top: '#e0527a', style: 'short', extras: 'beard' },
      { name: 'Nikhil Kumar', handle: 'nikhilkumar_arvn', city: '', skin: '#efc6a4', hair: '#2a1a14', top: '#136b57', style: 'short', extras: '' },
      { name: 'Babita Babi', handle: 'babitha_babi1', city: '', skin: '#e8b48c', hair: '#0f0c0b', top: '#9c1f2e', style: 'long', extras: '' },
      { name: 'Saikat Dey', handle: 'saikatdey_24', city: '', skin: '#d9a07a', hair: '#33201a', top: '#d9a21b', style: 'cap', extras: 'glasses' },
      { name: 'Kanika Sharma', handle: 'kanikaasharma27', city: '', skin: '#ecc19c', hair: '#1b1210', top: '#3a4a44', style: 'curly', extras: '' },
      { name: 'Khushi Bihani', handle: 'khushhib', city: '', skin: '#c98d64', hair: '#15110f', top: '#5a67d8', style: 'long', extras: '' },
      { name: 'Nidhi Dixit', handle: 'iam_nidhidixit', city: '', skin: '#d4996f', hair: '#2a1a14', top: '#d9467a', style: 'long', extras: 'bindi' },
      { name: 'Nibedita Roy', handle: 'yor_tani', city: '', skin: '#e0ab83', hair: '#0f0c0b', top: '#2b6cb0', style: 'bun', extras: '' },
      { name: 'Tharesh', handle: 'myview.7', city: '', skin: '#b87850', hair: '#33201a', top: '#2e9c86', style: 'short', extras: 'beard' },
      { name: 'Sarika Siri', handle: 'sarika.k.9', city: '', skin: '#efc6a4', hair: '#1b1210', top: '#e08a1e', style: 'long', extras: 'bindi' }
    ]
  },
  references: {
    eyebrow: 'References',
    title: 'Brands that can vouch for our work.',
    text: 'We are happy to connect you with our past clients. Ask for a reference call and speak to a brand we have worked with.',
    items: [
      { brand: 'Allen', industry: 'Education', outcome: 'Brand awareness campaign — 20M+ views', since: 'Awareness campaign' },
      { brand: 'Nat Habit', industry: 'D2C · Skincare', outcome: 'Views & conversions — 30M+', since: '6 months, continuous' },
      { brand: 'Ghar Soaps', industry: 'Personal care', outcome: '200+ influencers every month — ~20M views/month', since: '1 year, continuous' },
      { brand: 'Prince', industry: 'Education', outcome: 'Admissions campaign — 350 students', since: 'Lead generation' }
    ],
    badges: ['4+ years in business', '70+ brands served', '10,000+ creators', 'Reports after every campaign'],
    cta: 'Request a reference call',
    ctaText: 'Hi Remso Media, I would like a reference call with one of your past clients.'
  },
  profile: {
    eyebrow: 'Company profile',
    title: 'We don’t just find influencers. We build brand impact.',
    text: 'Download our 15-page portfolio — who we are, our numbers, services, case studies and how we work. Share it with your team in one tap.',
    file: '/Remso_Media_Portfolio.pdf',
    button: 'Download portfolio (PDF)',
    pages: '15 pages · PDF',
    why: ['Pan-India creator access', 'Category-specific influencer matching', 'Regional and multilingual campaigns', 'Nano-to-celebrity influencer network', 'End-to-end campaign coordination', 'Performance reporting', 'Flexible campaign strategies'],
    disclaimer: 'Figures are agency-reported and have not been independently verified. Brand names belong to their respective owners and are listed to indicate collaboration only.'
  },
  clients: {
    eyebrow: 'Brands we have worked with',
    title: '70+ brands. Every kind of category.',
    groups: [
      { name: 'Education', brands: ['Allen', 'Prince', 'Keshwanand', 'Apex'] },
      { name: 'D2C & Beauty', brands: ['Mamaearth', 'Plix', 'Nat Habit', 'Beco', 'Muchstac', 'Ghar Soaps'] },
      { name: 'Fashion', brands: ['Park Avenue'] },
      { name: 'Marketplaces & Quick commerce', brands: ['Flipkart', 'Amazon', 'Zepto', 'Blinkit', 'Rapido'] }
    ],
    logoNote: 'Have the official logo files? Upload them in Admin → Clients → Logos to replace the styled names.',
    logos: ['Allen', 'Prince', 'Keshwanand', 'Apex', 'Mamaearth', 'Plix', 'Nat Habit', 'Beco', 'Muchstac', 'Ghar Soaps', 'Park Avenue', 'Flipkart', 'Amazon', 'Zepto', 'Blinkit', 'Rapido'].map((name) => ({ name, image: '' }))
  },
  services: {
    eyebrow: 'What we do',
    title: 'Everything your next campaign needs.',
    items: [
      { icon: '🎯', title: 'Influencer Marketing', text: 'Put your brand in front of audiences that trust the creators they follow.' },
      { icon: '📣', title: 'Brand Awareness Campaigns', text: 'Build recognition at scale with short-form, creator-led content.' },
      { icon: '🚀', title: 'Product Launch Campaigns', text: 'Create launch-day buzz with coordinated creator rollouts.' },
      { icon: '🛒', title: 'Creator-led Sales & Conversion', text: 'Turn creator trust into clicks, orders and repeat buyers.' },
      { icon: '🌐', title: 'Regional Influencer Campaigns', text: 'Speak to every market in its own language and culture.' },
      { icon: '🎓', title: 'Admissions & Lead Generation', text: 'Generate qualified enquiries and enrolments through creators.' },
      { icon: '🎬', title: 'User-generated Content Strategy', text: 'Get authentic, ready-to-use content that builds credibility.' },
      { icon: '🤝', title: 'Always-on Influencer Programmes', text: 'Stay visible month after month with ongoing collaborations.' }
    ]
  },
  process: {
    eyebrow: 'How it works',
    title: 'From brief to buzz in four steps.',
    steps: [
      { title: 'Brief & Strategy', text: 'We understand your goal, audience, budget and build a creator plan.' },
      { title: 'Match Creators', text: 'We pick the right mix of nano to celebrity creators by category, language and state.' },
      { title: 'Launch & Manage', text: 'Briefing, content approval, posting and coordination — fully handled.' },
      { title: 'Report & Scale', text: 'Clear performance report, then we double down on what works.' }
    ]
  },
  about: {
    eyebrow: 'Meet the founder',
    title: 'Built on trust with creators and brands.',
    name: 'Ramesh',
    role: 'Founder, Remso Media',
    text: 'Remso Media was built to make influencer marketing simple, transparent and result-driven. In 4 years we have grown a network of 10,000+ creators and served 70+ brands across India — and we still focus on one thing: connecting your brand with the right creators.',
    points: ['4+ years of experience', 'Direct relationships with creators', 'Transparent pricing & reporting', 'Pan-India, multi-language reach'],
    image1: '/images/founder-1.jpg',
    image2: '/images/founder-2.jpg'
  },
  team: {
    eyebrow: 'The team',
    title: 'The people behind your campaigns.',
    text: 'A small, hands-on team — every brand gets a dedicated point of contact.',
    members: [
      { name: 'Ramesh', role: 'Founder', bio: 'Leads strategy and brand partnerships.', image: '/images/founder-1.jpg', skin: '#d9a07a', hair: '#15110f', top: '#8aa6d6', style: 'short', extras: 'glasses,beard' },
      { name: 'Priya Sharma', role: 'Creator Partnerships', bio: 'Builds and manages our 10,000+ creator network.', image: '', skin: '#ecc19c', hair: '#1b1210', top: '#d9467a', style: 'long', extras: 'bindi' },
      { name: 'Aman Verma', role: 'Campaign Manager', bio: 'Runs campaigns end to end, from brief to report.', image: '', skin: '#d4996f', hair: '#100c0a', top: '#2e9c86', style: 'short', extras: '' },
      { name: 'Neha Patil', role: 'Content & Strategy', bio: 'Shapes briefs, scripts and creative direction.', image: '', skin: '#e0ab83', hair: '#2a1a14', top: '#d9a21b', style: 'bun', extras: 'glasses' }
    ]
  },
  what: {
    eyebrow: 'Influencer marketing, explained',
    title: 'People trust people. Influencer marketing puts your brand in their voice.',
    text: 'Influencer marketing means partnering with creators whose audiences already trust them, so your product is introduced through a real recommendation instead of a banner. It is the fastest way for a modern brand to earn attention, trust and sales — especially in a country as diverse as India.',
    flow: ['Your brand', 'Right creator', 'Their audience', 'Sales & growth'],
    benefitsTitle: 'Why your brand needs it',
    benefits: [
      { icon: '🤝', title: 'Trust you cannot buy with ads', text: 'A recommendation from a creator people follow carries more weight than any advertisement.' },
      { icon: '🎯', title: 'Reach the exact audience', text: 'Pick creators by category, language, state and age group — no wasted impressions.' },
      { icon: '🎬', title: 'Content that feels real', text: 'Reels, shorts and reviews made by creators perform better than polished brand videos.' },
      { icon: '💸', title: 'Lower cost per customer', text: 'Nano and micro creators deliver strong engagement at a fraction of traditional ad costs.' },
      { icon: '🗣️', title: 'Speak every language', text: 'Regional creators let you talk to Bharat in its own language and culture.' },
      { icon: '📈', title: 'Measurable results', text: 'Views, clicks, leads and sales — tracked and reported campaign by campaign.' }
    ],
    compareTitle: 'Influencer marketing vs traditional ads',
    compare: [
      { label: 'Trust', ads: 'Seen as a promotion', inf: 'Seen as a recommendation' },
      { label: 'Targeting', ads: 'Broad demographics', inf: 'Niche, language & city specific' },
      { label: 'Content', ads: 'Brand-made, polished', inf: 'Creator-made, authentic' },
      { label: 'Cost', ads: 'Rising every year', inf: 'Flexible — nano to celebrity' },
      { label: 'Reusability', ads: 'One-time creative', inf: 'Reuse content on ads & pages' }
    ]
  },
  caseStudies: {
    eyebrow: 'Case studies',
    title: 'How we turn creators into results.',
    text: 'Real campaigns, real numbers. Pick a brand to see the goal, our approach and the outcome.',
    items: [
      { brand: 'Allen', industry: 'Education', goal: 'Brand awareness', metric: 20, suffix: 'M+', metricLabel: 'views counted',
        challenge: 'Build large-scale awareness among students and parents across India, quickly and credibly.',
        approach: 'A wide mix of creators matched by audience, language and state, publishing short-form video content at scale.',
        results: [{ v: '20M+', l: 'Total views' }, { v: 'Pan-India', l: 'Reach' }], tags: ['Awareness', 'Short-form video', 'Multi-language'] },
      { brand: 'Nat Habit', industry: 'D2C · Skincare', goal: 'Views & conversions', metric: 30, suffix: 'M+', metricLabel: 'views & conversions',
        challenge: 'Turn views into real purchases, consistently, month after month.',
        approach: 'A continuous programme for 6 months with refreshed creators and content, optimised on what converted best.',
        results: [{ v: '30M+', l: 'Views & conversions' }, { v: '6 months', l: 'Running continuously' }], tags: ['Always-on', 'Conversion', 'Beauty'] },
      { brand: 'Ghar Soaps', industry: 'Personal care', goal: 'Consistent monthly reach', metric: 20, suffix: 'M', metricLabel: 'views every month',
        challenge: 'Keep the brand visible every single month, not just during a launch.',
        approach: 'An always-on programme activating 200+ influencers every month for a full year.',
        results: [{ v: '~20M', l: 'Views per month' }, { v: '200+', l: 'Influencers monthly' }, { v: '1 year', l: 'Continuous' }], tags: ['Always-on', '200+ creators', 'Scale'] },
      { brand: 'Prince', industry: 'Education · Admissions', goal: 'Student admissions', metric: 350, suffix: '', metricLabel: 'students enrolled',
        challenge: 'Generate genuine student enquiries and admissions, not just views.',
        approach: 'Creator-led lead generation, using education and local creators to build trust with students and parents.',
        results: [{ v: '350', l: 'Students' }], tags: ['Lead generation', 'Admissions', 'Education'] },
      { brand: 'Muchstac', industry: 'Men’s grooming', goal: 'Views, sales & conversions', metric: 0, suffix: '', metricLabel: 'Sales driven by creators',
        challenge: 'Stand out in a crowded grooming category and drive sales.',
        approach: 'Creator campaigns focused on authentic product usage and conversion.',
        results: [{ v: 'Views', l: 'Delivered' }, { v: 'Sales', l: 'Driven' }, { v: 'Conversions', l: 'Tracked' }], tags: ['Sales', 'Grooming'] },
      { brand: 'Beco', industry: 'Sustainable lifestyle', goal: 'Brand campaign', metric: 0, suffix: '', metricLabel: 'Creator-led campaign',
        challenge: 'Tell a conscious-living story that feels genuine.',
        approach: 'Creators whose values and audience fit the brand’s purpose.',
        results: [{ v: 'Creator-led', l: 'Campaign' }], tags: ['Brand story', 'Sustainability'] }
    ]
  },
  faq: {
    title: 'Questions brands ask us',
    items: [
      { q: 'How long have you been doing this?', a: 'Remso Media has 4+ years of experience in influencer marketing, with 70+ brands served across India.' },
      { q: 'What types of influencers do you work with?', a: 'Nano, micro, macro, mega influencers and celebrities across lifestyle, beauty & fashion, mom & baby, entertainment, regional, travel, tech, finance & business, real estate, education and news.' },
      { q: 'Can you run campaigns in regional languages?', a: 'Yes. Our network covers every state and language — South, North, East and North East India — including local creators.' },
      { q: 'How quickly can a campaign go live?', a: 'Once the brief and budget are final, most campaigns go live within days. Always-on programmes run monthly.' },
      { q: 'Do you handle both awareness and sales campaigns?', a: 'Yes. We have delivered awareness campaigns with 20M+ views as well as conversion and admissions campaigns.' },
      { q: 'How do I get started?', a: 'Call or WhatsApp +91 93516 41459, use the chat assistant, or fill in the contact form — we will come back with a custom plan.' }
    ]
  },
  footer: {
    blurb: 'India’s creator-first influencer marketing agency. 10,000+ creators, 70+ brands, 4+ years — connecting brands with the right creators.',
    ctaTitle: 'Let’s build your next big campaign.',
    ctaText: 'Talk to the founder directly. Share your goal and we’ll come back with a creator plan.'
  },
  cta: {
    title: 'Ready to make your brand the next big thing?',
    text: 'Tell us about your brand — we will come back with a creator plan within 24 hours.'
  }
};
