export const dictionaries = {
  en: {
    // Navigation & General
    home: "Home",
    chat: "Chat",
    history: "History",
    profile: "Profile",
    create: "Create",
    signIn: "Sign in",
    signOut: "Sign out",
    downloadApk: "Download APK",
    drawingHistory: "Drawing History",
    myProfile: "My Profile",
    credits: "Credits",
    
    // Landing Page
    heroTitle1: "Fair Draws.",
    heroTitle2: "Zero",
    heroTitle3: "Friction.",
    heroDesc: "Giveaway App is a mobile-first community giveaway platform. Run transparent coin draws with smart credits, zero-wait automatic draws, and frictionless guest entry.",
    ctaDownload: "Download APK",
    footerText: "Created by lil owi",
    
    // Guest Onboarding
    guestWelcome: "Welcome, Guest! 👋",
    guestDesc: "Before you can join giveaways or chat with the community, you need to set a custom username.",
    guestUsernameLabel: "Guest Username",
    guestUsernamePlaceholder: "e.g. LukeSkywalker",
    guestSaveBtn: "Save Username",
    guestSavingBtn: "Saving...",
    
    // Chat Actions
    chatReply: "💬 Reply",
    chatCopy: "📋 Copy Text",
    chatCopied: "Text copied to clipboard!",
    
    // Profile Settings
    languageSettings: "Language / Bahasa",
    english: "English",
    indonesia: "Bahasa Indonesia",
  },
  id: {
    // Navigation & General
    home: "Beranda",
    chat: "Obrolan",
    history: "Riwayat",
    profile: "Profil",
    create: "Buat",
    signIn: "Masuk",
    signOut: "Keluar",
    downloadApk: "Unduh APK",
    drawingHistory: "Riwayat Undian",
    myProfile: "Profil Saya",
    credits: "Kredit",
    
    // Landing Page
    heroTitle1: "Undian Adil.",
    heroTitle2: "Tanpa",
    heroTitle3: "Ribet.",
    heroDesc: "Luke App adalah platform undian komunitas mobile-first. Jalankan undian koin transparan dengan sistem kredit, tanpa menunggu, dan akses masuk tamu yang mudah.",
    ctaDownload: "Unduh APK",
    footerText: "Dibuat oleh lil owi",
    
    // Guest Onboarding
    guestWelcome: "Selamat datang, Tamu! 👋",
    guestDesc: "Sebelum Anda dapat bergabung dengan undian atau mengobrol dengan komunitas, Anda harus mengatur username khusus.",
    guestUsernameLabel: "Username Tamu",
    guestUsernamePlaceholder: "Contoh: LukeSkywalker",
    guestSaveBtn: "Simpan Username",
    guestSavingBtn: "Menyimpan...",
    
    // Chat Actions
    chatReply: "💬 Balas",
    chatCopy: "📋 Salin Teks",
    chatCopied: "Teks disalin ke papan klip!",
    
    // Profile Settings
    languageSettings: "Language / Bahasa",
    english: "English",
    indonesia: "Bahasa Indonesia",
  }
};

export type Language = "en" | "id";
export type Dictionary = typeof dictionaries.en;
export type DictionaryKey = keyof Dictionary;
