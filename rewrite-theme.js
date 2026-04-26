const fs = require('fs');

function rewriteFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add Theme import if not present
  if (!content.includes('import { Theme } from "@/lib/theme.config";') && filepath.endsWith('.tsx')) {
    content = content.replace('import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { Theme } from "@/lib/theme.config";');
  }

  // 1. Root container in WidgetFlow
  content = content.replace(
    'className="w-full max-w-xl mx-auto p-4 sm:p-8 rounded-3xl backdrop-blur-3xl bg-white/30 dark:bg-black/80 border border-white/40 dark:border-white/10 shadow-2xl relative overflow-hidden text-neutral-900 dark:text-white"',
    'className={cn(Theme.classes.widgetWrapper, Theme.classes.widgetGlass)}'
  );

  // 2. Checkout button
  content = content.replace(
    /className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 hover:bg-emerald-500 hover:bg-emerald-400 text-white  rounded-xl transition-all shadow-xl shadow-emerald-500\/20 active:scale-\[0.98\] font-sans"/g,
    'className={Theme.classes.primaryButton}'
  );
  
  // 3. Complete payment button
  content = content.replace(
    /className="w-full py-4 bg-black dark:bg-white text-white dark:text-black  rounded-xl hover:scale-\[1.02\] active:scale-\[0.98\] transition-transform shadow-2xl disabled:opacity-50 disabled:active:scale-100"/g,
    'className={Theme.classes.secondaryButton}'
  );

  // 4. Emerald color replacements -> Brand Blue
  content = content.replace(/emerald-500/g, 'brand-blue');
  content = content.replace(/emerald-400/g, 'brand-jasmine');
  content = content.replace(/emerald-600/g, 'brand-blue');
  
  // 5. Hardcode replacements inside classNames to Latte/Black
  content = content.replace(/"([^"]*)text-white([^"]*)"/g, '"$1text-brand-latte$2"');
  content = content.replace(/"([^"]*)bg-black([^"]*)"/g, '"$1bg-brand-black$2"');
  content = content.replace(/'([^']*)text-white([^']*)'/g, "'$1text-brand-latte$2'");
  content = content.replace(/'([^']*)bg-black([^']*)'/g, "'$1bg-brand-black$2'");
  content = content.replace(/dark:bg-white/g, 'dark:bg-brand-latte');
  content = content.replace(/dark:text-black/g, 'dark:text-brand-black');

  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`Rewrote ${filepath}`);
}

rewriteFile('src/components/ui/WidgetFlow.tsx');
rewriteFile('src/components/admin/AdminCalendarFlow.tsx');
rewriteFile('src/app/admin/layout.tsx');
