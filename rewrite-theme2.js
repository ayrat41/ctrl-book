const fs = require('fs');

function rewriteFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add Theme import if not present
  if (!content.includes('import { Theme } from "@/lib/theme.config";') && filepath.endsWith('.tsx')) {
    content = content.replace('import { cn } from "@/lib/utils";', 'import { cn } from "@/lib/utils";\nimport { Theme } from "@/lib/theme.config";');
  }

  // Emerald color replacements -> Brand Blue
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
}

[
  'src/app/page.tsx',
  'src/components/admin/NewAddOnButton.tsx',
  'src/components/admin/NewPromoButton.tsx',
  'src/components/admin/StudioRegistry.tsx',
  'src/components/admin/EditStudioModal.tsx',
  'src/app/widget/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/promos/page.tsx',
  'src/app/admin/locations/page.tsx',
  'src/app/admin/addons/page.tsx',
  'src/app/admin/bookings/page.tsx'
].forEach(f => {
  if (fs.existsSync(f)) {
    rewriteFile(f);
    console.log("Rewrote", f);
  }
});
