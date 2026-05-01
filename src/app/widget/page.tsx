import WidgetFlow from "@/components/ui/WidgetFlow";
import WidgetCustomizer from "./WidgetCustomizer";
import { redirect } from "next/navigation";

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const sessionId = params.session_id as string | undefined;
  const returnUrl = params.returnUrl as string | undefined;

  if (sessionId) {
    redirect(`/booking/success?session_id=${sessionId}&embedded=true&returnUrl=${encodeURIComponent(returnUrl || '')}`);
  }

  // Extract styling parameters
  const primaryColor = params.primaryColor as string | undefined;
  const bgColor = params.bgColor as string | undefined;
  const textColor = params.textColor as string | undefined;
  const hideBg = params.hideBg === "true";
  const fontFamily = params.fontFamily as string | undefined;
  const headingFont = params.headingFont as string | undefined;
  const borderRadius = params.borderRadius as string | undefined;
  const borderWidth = params.borderWidth as string | undefined;
  const borderColor = params.borderColor as string | undefined;
  const btnTextColor = params.btnTextColor as string | undefined;
  const hideShadows = params.hideShadows === "true";
  const darkMode = params.darkMode === "true";
  
  // Custom style overrides mapping URL parameters to CSS variables
  const styleOverrides = {
    ...(primaryColor && { 
      "--color-brand-black": primaryColor,
      "--primary-color": primaryColor 
    }),
    ...(bgColor && { "--background": bgColor, "--color-background": bgColor }),
    ...(textColor && { "--foreground": textColor, "--color-foreground": textColor }),
    ...(fontFamily && { "--font-sans": fontFamily }),
    ...(headingFont && { "--heading-font": headingFont }),
    ...(borderRadius && { "--border-radius": borderRadius }),
    ...(borderWidth && { "--border-width": borderWidth }),
    ...(borderColor && { "--border-color": borderColor }),
    ...(btnTextColor && { "--button-text-color": btnTextColor }),
    ...(hideShadows && { "--shadow-style": "none" }),
  } as React.CSSProperties;

  return (
    <main 
      className={`min-h-screen w-full flex flex-col items-center justify-center p-0 sm:p-4 relative ${hideBg ? "bg-transparent" : ""}`}
      style={styleOverrides}
    >
      <WidgetCustomizer />
      <WidgetFlow returnUrl={returnUrl} />
    </main>
  );
}
