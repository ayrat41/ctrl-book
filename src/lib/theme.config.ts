export const Theme = {
  colors: {
    primary: "brand-jasmine",
    secondary: "brand-blue",
    dark: "brand-black",
    light: "brand-latte"
  },
  classes: {
    // ----------------------------------------
    // WIDGET (CLIENT-SIDE)
    // ----------------------------------------
    
    // Main Container
    widgetWrapper: "w-full max-w-xl mx-auto p-4 sm:p-8 rounded-3xl relative overflow-hidden text-brand-black dark:text-brand-latte transition-colors duration-300",
    widgetGlass: "backdrop-blur-3xl bg-brand-latte/50 dark:bg-brand-black/90 border border-brand-black/10 dark:border-brand-latte/10 shadow-2xl",
    
    // Typography
    h1: "text-3xl font-black tracking-tight font-sans",
    h2: "text-2xl font-black tracking-tight font-sans",
    h3: "text-xl font-black tracking-tight font-sans",
    body: "text-base font-normal font-sans",

    // Buttons
    primaryButton: "bg-brand-blue hover:bg-[#124294] text-brand-latte border-transparent shadow-xl shadow-brand-blue/20 flex items-center justify-center font-bold px-5 py-3 rounded-xl transition-all active:scale-[0.98]",
    secondaryButton: "bg-brand-jasmine hover:bg-[#FCE062] text-brand-black border-transparent shadow-xl shadow-brand-jasmine/20 flex items-center justify-center font-bold px-5 py-3 rounded-xl transition-all active:scale-[0.98]",
    outlineButton: "border-2 border-brand-black/20 dark:border-brand-latte/20 hover:border-brand-black dark:hover:border-brand-latte bg-transparent text-brand-black dark:text-brand-latte font-bold px-5 py-3 rounded-xl transition-all",
    
    // Interactions
    selectableCardBase: "border transition-all duration-300 rounded-xl",
    selectableCardActive: "border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/20 ring-1 ring-brand-blue shadow-md",
    selectableCardHover: "hover:border-brand-blue/50 hover:bg-brand-black/5 dark:hover:bg-brand-latte/5",

    // ----------------------------------------
    // ADMIN DASHBOARD
    // ----------------------------------------

    adminHeader: "bg-brand-latte dark:bg-brand-black p-8 rounded-[2.5rem] border border-brand-black/5 dark:border-brand-latte/5 shadow-2xl",
    adminCard: "bg-brand-latte dark:bg-brand-black p-8 rounded-[2.5rem] border border-brand-black/5 dark:border-brand-latte/5 shadow-xl",
    
    // Admin Inputs
    adminInput: "px-6 py-4 rounded-2xl bg-brand-black/5 dark:bg-brand-latte/5 border border-transparent focus:border-brand-blue/50 outline-none font-bold text-sm transition-colors",
    adminLabel: "text-[10px] font-black uppercase tracking-widest opacity-40 ml-2",

    // Admin Badges/Statuses
    badgeActive: "bg-brand-jasmine text-brand-black",
    badgeInactive: "bg-neutral-200 dark:bg-neutral-800 text-neutral-500",

    // Miscellaneous Shared
    pillActive: "bg-brand-black text-brand-latte dark:bg-brand-latte dark:text-brand-black shadow-lg",
    pillInactive: "text-neutral-600 hover:bg-brand-black/5 dark:text-neutral-400 dark:hover:bg-brand-latte/10 text-brand-black/50 dark:text-brand-latte/50",
  }
};
