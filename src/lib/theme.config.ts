export const Theme = {
  colors: {
    primary: "brand-jasmine",
    secondary: "brand-blue",
    dark: "brand-black",
    light: "brand-latte",
  },
  classes: {
    // ----------------------------------------
    // WIDGET (CLIENT-SIDE)
    // ----------------------------------------

    // Main Container
    widgetWrapper:
      "w-full max-w-4xl sm:mx-auto px-0 sm:px-8 py-2 sm:py-8 rounded-none relative overflow-hidden text-brand-black dark:text-brand-latte transition-colors duration-300",
    widgetGlass: "bg-[#EAE6DD] dark:bg-[#1A1A1A] shadow-none border-none rounded-none",
    cardGlass: "bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[2.5rem] border border-black/5 dark:border-white/5 shadow-xl",

    // Typography
    h1: "font-['Archivo_Black'] uppercase tracking-tight",
    h2: "font-['Archivo_Black'] uppercase tracking-tight",
    h3: "font-['Archivo_Black'] uppercase tracking-tight",
    body: "font-['Space_Grotesk'] font-semibold",

    // Buttons
    primaryButton:
      "bg-[#2D2D2A] dark:bg-[#EAE6DD] text-[#EAE6DD] dark:text-[#2D2D2A] uppercase font-semibold tracking-normal rounded-full px-8 py-5 text-base border-none shadow-none hover:opacity-90 transition-opacity",
    secondaryButton:
      "bg-[#34659B] text-[#EAE6DD] uppercase font-semibold tracking-normal rounded-full px-8 py-5 text-base border-none shadow-none hover:opacity-90 transition-opacity",
    outlineButton:
      "border border-[#2D2D2A] dark:border-[#EAE6DD] bg-transparent text-[#2D2D2A] dark:text-[#EAE6DD] uppercase font-semibold tracking-normal rounded-full px-8 py-5 text-base hover:opacity-90 transition-opacity",

    // Interactions
    selectableCardBase: "border border-black/10 dark:border-white/10 transition-all duration-300 rounded-none",
    selectableCardActive: "border border-[#2D2D2A] dark:border-[#EAE6DD] bg-[#2D2D2A]/5 dark:bg-[#EAE6DD]/5",
    selectableCardHover: "hover:border-[#2D2D2A] dark:hover:border-[#EAE6DD] hover:bg-black/5 dark:hover:bg-white/5",

    // ----------------------------------------
    // ADMIN DASHBOARD
    // ----------------------------------------

    adminHeader:
      "bg-brand-latte dark:bg-brand-black p-8 rounded-[2.5rem] border border-brand-black/5 dark:border-brand-latte/5 shadow-2xl",
    adminCard:
      "bg-brand-latte dark:bg-brand-black p-8 rounded-[2.5rem] border border-brand-black/5 dark:border-brand-latte/5 shadow-xl",

    // Admin Inputs
    adminInput:
      "px-6 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none  text-sm transition-colors",
    adminLabel: "text-[10px]  uppercase tracking-widest opacity-40 ml-2",

    // Admin Badges/Statuses
    badgeActive: "bg-brand-jasmine text-brand-black",
    badgeInactive: "bg-neutral-200 dark:bg-neutral-800 text-neutral-500",

    // Miscellaneous Shared
    pillActive:
      "bg-brand-black text-brand-latte dark:bg-brand-latte dark:text-brand-black shadow-lg",
    pillInactive:
      "text-neutral-600 hover:bg-brand-black/5 dark:text-neutral-400 dark:hover:bg-brand-latte/10 text-brand-black/50 dark:text-brand-latte/50",
  },
};
