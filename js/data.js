// ============================================================
// Maharashtra Police Bharti PVQ Platform — Data Module
// ============================================================

const EXAM_CONFIG = {
  totalQuestions: 100,
  totalTime: 90, // minutes
  passingPercent: 40,
  negativeMarking: false,
  sections: [
    { id: 'math', name: 'गणित (Mathematics)', nameEn: 'Mathematics', icon: '🔢', questions: 25, color: '#4CAF50' },
    { id: 'gk', name: 'सामान्यज्ञान (GK & Current Affairs)', nameEn: 'GK & Current Affairs', icon: '🌍', questions: 25, color: '#2196F3' },
    { id: 'reasoning', name: 'बुद्धिमत्ता चाचणी (Reasoning)', nameEn: 'Reasoning', icon: '🧠', questions: 25, color: '#FF9800' },
    { id: 'marathi', name: 'मराठी व्याकरण (Marathi Grammar)', nameEn: 'Marathi Grammar', icon: '📖', questions: 25, color: '#9C27B0' }
  ]
};

const EXAM_TYPES = [
  {
    id: 'police_bharti',
    name: 'पोलीस भरती',
    nameEn: 'Police Bharti',
    icon: '🛡️',
    description: 'महाराष्ट्र पोलीस कॉन्स्टेबल भरती',
    descEn: 'Maharashtra Police Constable Recruitment',
    hasDistricts: true
  },
  {
    id: 'srpf',
    name: 'SRPF',
    nameEn: 'State Reserve Police Force',
    icon: '⚔️',
    description: 'राज्य राखीव पोलीस दल भरती',
    descEn: 'State Reserve Police Force Recruitment',
    hasDistricts: false
  }
];

// Administrative divisions with colors
const DIVISIONS = {
  pune: { name: 'पुणे विभाग', color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #A78BFA)' },
  nagpur: { name: 'नागपूर विभाग', color: '#EA580C', gradient: 'linear-gradient(135deg, #EA580C, #FB923C)' },
  nashik: { name: 'नाशिक विभाग', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #34D399)' },
  konkan: { name: 'कोकण विभाग', color: '#0284C7', gradient: 'linear-gradient(135deg, #0284C7, #38BDF8)' },
  amravati: { name: 'अमरावती विभाग', color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #FCD34D)' },
  aurangabad: { name: 'छत्रपती संभाजीनगर विभाग', color: '#BE123C', gradient: 'linear-gradient(135deg, #BE123C, #FB7185)' }
};

// 36 Districts with khasiyat (specialty)
const DISTRICTS = [
  // Pune Division
  { id: 'pune', name: 'पुणे', nameEn: 'Pune', division: 'pune', emoji: '🏛️', khasiyat: 'शिक्षणाची राजधानी', khasiyatEn: 'Education Capital', bgPattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(124,58,237,0.05) 10px, rgba(124,58,237,0.05) 20px)' },
  { id: 'satara', name: 'सातारा', nameEn: 'Satara', division: 'pune', emoji: '🍓', khasiyat: 'स्ट्रॉबेरी आणि महाबळेश्वर', khasiyatEn: 'Strawberries & Mahabaleshwar', bgPattern: 'radial-gradient(circle at 90% 10%, rgba(220,38,38,0.08) 0%, transparent 50%)' },
  { id: 'sangli', name: 'सांगली', nameEn: 'Sangli', division: 'pune', emoji: '🍬', khasiyat: 'साखर उद्योग', khasiyatEn: 'Sugar Industry', bgPattern: 'radial-gradient(circle at 10% 90%, rgba(124,58,237,0.06) 0%, transparent 50%)' },
  { id: 'solapur', name: 'सोलापूर', nameEn: 'Solapur', division: 'pune', emoji: '🧵', khasiyat: 'सोलापुरी चादर आणि टेक्सटाईल', khasiyatEn: 'Solapuri Chaddar & Textiles', bgPattern: 'repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(124,58,237,0.04) 15px, rgba(124,58,237,0.04) 30px)' },
  { id: 'kolhapur', name: 'कोल्हापूर', nameEn: 'Kolhapur', division: 'pune', emoji: '👡', khasiyat: 'कोल्हापुरी चप्पल आणि महालक्ष्मी', khasiyatEn: 'Kolhapuri Chappal & Mahalaxmi', bgPattern: 'radial-gradient(circle at 50% 50%, rgba(220,38,38,0.06) 0%, transparent 60%)' },

  // Nashik Division
  { id: 'nashik', name: 'नाशिक', nameEn: 'Nashik', division: 'nashik', emoji: '🍇', khasiyat: 'वाईन कॅपिटल ऑफ इंडिया', khasiyatEn: 'Wine Capital of India', bgPattern: 'radial-gradient(circle at 80% 20%, rgba(5,150,105,0.08) 0%, transparent 50%)' },
  { id: 'ahmednagar', name: 'अहमदनगर', nameEn: 'Ahmednagar', division: 'nashik', emoji: '🕌', khasiyat: 'शिर्डी साईबाबा', khasiyatEn: 'Shirdi Sai Baba', bgPattern: 'radial-gradient(circle at 20% 80%, rgba(5,150,105,0.06) 0%, transparent 50%)' },
  { id: 'dhule', name: 'धुळे', nameEn: 'Dhule', division: 'nashik', emoji: '🏰', khasiyat: 'सोनगीर किल्ला', khasiyatEn: 'Songir Fort', bgPattern: 'repeating-linear-gradient(135deg, transparent, transparent 12px, rgba(5,150,105,0.04) 12px, rgba(5,150,105,0.04) 24px)' },
  { id: 'jalgaon', name: 'जळगाव', nameEn: 'Jalgaon', division: 'nashik', emoji: '🍌', khasiyat: 'केळीचे आगार', khasiyatEn: 'Banana Capital', bgPattern: 'radial-gradient(circle at 90% 90%, rgba(234,179,8,0.08) 0%, transparent 50%)' },
  { id: 'nandurbar', name: 'नंदुरबार', nameEn: 'Nandurbar', division: 'nashik', emoji: '🏔️', khasiyat: 'आदिवासी संस्कृती', khasiyatEn: 'Tribal Culture', bgPattern: 'radial-gradient(circle at 50% 10%, rgba(5,150,105,0.06) 0%, transparent 50%)' },

  // Konkan Division
  { id: 'mumbai_city', name: 'मुंबई शहर', nameEn: 'Mumbai City', division: 'konkan', emoji: '🎬', khasiyat: 'बॉलिवूड आणि आर्थिक राजधानी', khasiyatEn: 'Bollywood & Financial Capital', bgPattern: 'radial-gradient(circle at 50% 50%, rgba(2,132,199,0.1) 0%, transparent 60%)' },
  { id: 'mumbai_suburban', name: 'मुंबई उपनगर', nameEn: 'Mumbai Suburban', division: 'konkan', emoji: '🌊', khasiyat: 'जुहू बीच आणि उपनगरे', khasiyatEn: 'Juhu Beach & Suburbs', bgPattern: 'repeating-linear-gradient(180deg, transparent, transparent 8px, rgba(2,132,199,0.04) 8px, rgba(2,132,199,0.04) 16px)' },
  { id: 'navi_mumbai', name: 'नवी मुंबई', nameEn: 'Navi Mumbai', division: 'konkan', emoji: '🛣️', khasiyat: 'नियोजित शहर आणि फ्लेमिंगो अभयारण्य', khasiyatEn: 'Planned City & Flamingo Sanctuary', bgPattern: 'radial-gradient(circle at 40% 60%, rgba(2,132,199,0.05) 0%, transparent 60%)' },
  { id: 'mira_bhayandar', name: 'मीरा-भाईंदर', nameEn: 'Mira-Bhayandar', division: 'konkan', emoji: '🏢', khasiyat: 'जुने आणि नवे शहर', khasiyatEn: 'Blend of Old & New City', bgPattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(2,132,199,0.03) 10px, rgba(2,132,199,0.03) 20px)' },
  { id: 'thane', name: 'ठाणे', nameEn: 'Thane', division: 'konkan', emoji: '🏭', khasiyat: 'औद्योगिक शहर आणि तलाव', khasiyatEn: 'Industrial City & Lakes', bgPattern: 'radial-gradient(circle at 30% 70%, rgba(2,132,199,0.06) 0%, transparent 50%)' },
  { id: 'palghar', name: 'पालघर', nameEn: 'Palghar', division: 'konkan', emoji: '🎨', khasiyat: 'वारली चित्रकला', khasiyatEn: 'Warli Art', bgPattern: 'repeating-linear-gradient(60deg, transparent, transparent 10px, rgba(2,132,199,0.04) 10px, rgba(2,132,199,0.04) 20px)' },
  { id: 'raigad', name: 'रायगड', nameEn: 'Raigad', division: 'konkan', emoji: '🏯', khasiyat: 'रायगड किल्ला आणि अलिबाग', khasiyatEn: 'Raigad Fort & Alibaug', bgPattern: 'radial-gradient(circle at 70% 30%, rgba(2,132,199,0.08) 0%, transparent 50%)' },
  { id: 'ratnagiri', name: 'रत्नागिरी', nameEn: 'Ratnagiri', division: 'konkan', emoji: '🥭', khasiyat: 'हापूस आंबा', khasiyatEn: 'Alphonso Mangoes', bgPattern: 'radial-gradient(circle at 10% 10%, rgba(234,179,8,0.08) 0%, transparent 50%)' },
  { id: 'sindhudurg', name: 'सिंधुदुर्ग', nameEn: 'Sindhudurg', division: 'konkan', emoji: '🏖️', khasiyat: 'सिंधुदुर्ग किल्ला आणि मालवण', khasiyatEn: 'Sindhudurg Fort & Malvan', bgPattern: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(2,132,199,0.05) 6px, rgba(2,132,199,0.05) 12px)' },

  // Nagpur Division
  { id: 'nagpur', name: 'नागपूर', nameEn: 'Nagpur', division: 'nagpur', emoji: '🍊', khasiyat: 'ऑरेंज सिटी', khasiyatEn: 'Orange City', bgPattern: 'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.1) 0%, transparent 60%)' },
  { id: 'chandrapur', name: 'चंद्रपूर', nameEn: 'Chandrapur', division: 'nagpur', emoji: '🐅', khasiyat: 'ताडोबा व्याघ्र प्रकल्प', khasiyatEn: 'Tadoba Tiger Reserve', bgPattern: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(234,88,12,0.04) 8px, rgba(234,88,12,0.04) 16px)' },
  { id: 'bhandara', name: 'भंडारा', nameEn: 'Bhandara', division: 'nagpur', emoji: '🌾', khasiyat: 'तांदळाचे आगार', khasiyatEn: 'Rice Bowl', bgPattern: 'radial-gradient(circle at 80% 80%, rgba(234,88,12,0.06) 0%, transparent 50%)' },
  { id: 'gondia', name: 'गोंदिया', nameEn: 'Gondia', division: 'nagpur', emoji: '🦌', khasiyat: 'नागझिरा अभयारण्य', khasiyatEn: 'Nagzira Sanctuary', bgPattern: 'radial-gradient(circle at 20% 20%, rgba(5,150,105,0.06) 0%, transparent 50%)' },
  { id: 'gadchiroli', name: 'गडचिरोली', nameEn: 'Gadchiroli', division: 'nagpur', emoji: '🌲', khasiyat: 'घनदाट जंगले आणि आदिवासी', khasiyatEn: 'Dense Forests & Tribal Culture', bgPattern: 'radial-gradient(circle at 50% 90%, rgba(5,150,105,0.08) 0%, transparent 50%)' },
  { id: 'wardha', name: 'वर्धा', nameEn: 'Wardha', division: 'nagpur', emoji: '🕊️', khasiyat: 'सेवाग्राम आश्रम (गांधीजी)', khasiyatEn: 'Sevagram Ashram (Gandhiji)', bgPattern: 'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.05) 0%, transparent 50%)' },

  // Amravati Division
  { id: 'amravati', name: 'अमरावती', nameEn: 'Amravati', division: 'amravati', emoji: '🍊', khasiyat: 'संत्री आणि अंबादेवी मंदिर', khasiyatEn: 'Oranges & Ambadevi Temple', bgPattern: 'radial-gradient(circle at 60% 40%, rgba(217,119,6,0.08) 0%, transparent 50%)' },
  { id: 'akola', name: 'अकोला', nameEn: 'Akola', division: 'amravati', emoji: '🏗️', khasiyat: 'कापूस उत्पादन आणि नरनाळा किल्ला', khasiyatEn: 'Cotton & Narnala Fort', bgPattern: 'repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(217,119,6,0.04) 12px, rgba(217,119,6,0.04) 24px)' },
  { id: 'buldhana', name: 'बुलढाणा', nameEn: 'Buldhana', division: 'amravati', emoji: '☄️', khasiyat: 'लोणार विवर सरोवर', khasiyatEn: 'Lonar Crater Lake', bgPattern: 'radial-gradient(circle at 40% 60%, rgba(217,119,6,0.06) 0%, transparent 50%)' },
  { id: 'washim', name: 'वाशिम', nameEn: 'Washim', division: 'amravati', emoji: '♨️', khasiyat: 'गरम पाण्याचे झरे', khasiyatEn: 'Hot Springs', bgPattern: 'radial-gradient(circle at 70% 70%, rgba(220,38,38,0.06) 0%, transparent 50%)' },
  { id: 'yavatmal', name: 'यवतमाळ', nameEn: 'Yavatmal', division: 'amravati', emoji: '🧶', khasiyat: 'कॉटन सिटी', khasiyatEn: 'Cotton City', bgPattern: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(217,119,6,0.04) 10px, rgba(217,119,6,0.04) 20px)' },

  // Aurangabad (Chhatrapati Sambhajinagar) Division
  { id: 'aurangabad', name: 'छत्रपती संभाजीनगर', nameEn: 'Chhatrapati Sambhajinagar', division: 'aurangabad', emoji: '🏛️', khasiyat: 'अजिंठा-वेरूळ लेणी (UNESCO)', khasiyatEn: 'Ajanta-Ellora Caves (UNESCO)', bgPattern: 'radial-gradient(circle at 50% 50%, rgba(190,18,60,0.08) 0%, transparent 60%)' },
  { id: 'beed', name: 'बीड', nameEn: 'Beed', division: 'aurangabad', emoji: '🌻', khasiyat: 'ऊस तोडणी कामगार', khasiyatEn: 'Sugarcane Workers Heritage', bgPattern: 'radial-gradient(circle at 80% 20%, rgba(190,18,60,0.05) 0%, transparent 50%)' },
  { id: 'hingoli', name: 'हिंगोली', nameEn: 'Hingoli', division: 'aurangabad', emoji: '🔔', khasiyat: 'औंढा नागनाथ ज्योतिर्लिंग', khasiyatEn: 'Aundha Nagnath Jyotirlinga', bgPattern: 'radial-gradient(circle at 30% 30%, rgba(190,18,60,0.06) 0%, transparent 50%)' },
  { id: 'jalna', name: 'जालना', nameEn: 'Jalna', division: 'aurangabad', emoji: '🔩', khasiyat: 'स्टील उद्योग', khasiyatEn: 'Steel Industry Hub', bgPattern: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(190,18,60,0.04) 10px, rgba(190,18,60,0.04) 20px)' },
  { id: 'latur', name: 'लातूर', nameEn: 'Latur', division: 'aurangabad', emoji: '📚', khasiyat: 'लातूर पॅटर्न - शिक्षण', khasiyatEn: 'Latur Pattern - Education', bgPattern: 'radial-gradient(circle at 10% 50%, rgba(190,18,60,0.06) 0%, transparent 50%)' },
  { id: 'nanded', name: 'नांदेड', nameEn: 'Nanded', division: 'aurangabad', emoji: '🙏', khasiyat: 'हुजूर साहिब गुरुद्वारा', khasiyatEn: 'Hazur Sahib Gurudwara', bgPattern: 'radial-gradient(circle at 90% 50%, rgba(190,18,60,0.06) 0%, transparent 50%)' },
  { id: 'osmanabad', name: 'धाराशिव', nameEn: 'Dharashiv', division: 'aurangabad', emoji: '⚔️', khasiyat: 'तुळजाभवानी मंदिर', khasiyatEn: 'Tulja Bhavani Temple', bgPattern: 'radial-gradient(circle at 50% 80%, rgba(190,18,60,0.06) 0%, transparent 50%)' },
  { id: 'parbhani', name: 'परभणी', nameEn: 'Parbhani', division: 'aurangabad', emoji: '🕌', khasiyat: 'हजरत तुराबुल हक दर्गा', khasiyatEn: 'Hazrat Turabul Haq Dargah', bgPattern: 'repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(190,18,60,0.04) 8px, rgba(190,18,60,0.04) 16px)' }
];

// Available years for question papers
const AVAILABLE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

// Sample question paper JSON schema for admin reference
const SAMPLE_PAPER_SCHEMA = {
  district: "pune",
  year: 2024,
  examType: "police_bharti",
  sections: {
    math: [
      { q: "२ + ३ = ?", options: ["४", "५", "६", "७"], answer: 1 }
    ],
    gk: [
      { q: "महाराष्ट्राची राजधानी कोणती?", options: ["पुणे", "मुंबई", "नागपूर", "नाशिक"], answer: 1 }
    ],
    reasoning: [
      { q: "पुढील मालिकेतील पुढील संख्या शोधा: 2, 4, 8, 16, ?", options: ["24", "32", "20", "28"], answer: 1 }
    ],
    marathi: [
      { q: "'सूर्य' या शब्दाचा समानार्थी शब्द कोणता?", options: ["चंद्र", "रवी", "तारा", "ग्रह"], answer: 1 }
    ]
  }
};
