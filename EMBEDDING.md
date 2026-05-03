Widget Embedding Guide
This guide explains how to embed your ctrl-book widget into third-party sites like Framer, Squarespace, or WordPress using the new platform-agnostic system.

1. The "Acuity-Style" Embed Code
   Copy and paste this snippet into your website's Embed or HTML block.

html

<!-- 1. The Widget iFrame -->
<iframe 
  src="https://your-domain.com/widget?hideBg=true&primaryColor=%23000000" 
  id="ctrl-book-widget"
  width="100%" 
  scrolling="no" 
  style="border: none; overflow: hidden; width: 1px; min-width: 100%; transition: height 0.3s ease;"
></iframe>
<!-- 2. The Auto-Resizer Script -->
<script src="https://your-domain.com/embed.js"></script>
IMPORTANT

Replace your-domain.com with your actual App Runner URL: sbsce3vy25.us-east-1.awsapprunner.com

2. Step-by-Step for Framer
   Open your Framer project.
   In the left panel, go to Utility > Embed.
   Drag the Embed component onto your page.
   In the component settings (right panel), set the Type to HTML.
   Paste the code snippet above into the HTML field.
   Critical: In Framer, ensure the Embed container height is set to Auto (if possible) or simply use a flexible container. Our embed.js script will handle the exact height adjustment of the iframe automatically so it fits perfectly on any screen without double scrollbars!
3. Method 2: The "Gold Standard" Framer Code Component
   If you want the most robust integration (no double-loading, perfect URL parameters), use a Framer Code Component instead of the Embed tool.

   1. In Framer, go to Assets > Code.
   2. Click + Create Design Component and name it CtrlBookWidget.
   3. Replace all the code in the new file with the contents of [FRAMER_COMPONENT.tsx](file:///Users/aaibedullov/IdeaProjects/ctrl-book/FRAMER_COMPONENT.tsx).
   4. Save and drag the component onto your page.
   5. Use the right-hand panel in Framer to set your App URL and colors!

4. Styling via URL Parameters
   You can "Match Your Website" by changing the parameters in the src URL (Method 1) or using the Property Controls (Method 2).

Parameter Example Result
primaryColor %23FF5733 Sets buttons and accents to this Hex code (e.g. #FF5733).
hideBg true Makes the widget background transparent (shows your site's background).
bgColor %23FFFFFF Forces a specific background color inside the widget.
textColor %23222222 Sets the default text color.
fontFamily Inter Overrides the font (must be a standard font or loaded on the page).
Note on Hex Codes: Always replace the # with %23 in the URL (e.g., #000000 → %23000000).

5. Why use this over a simple iFrame?
   - Auto-Adjusting Size: The script communicates securely with the widget. If the calendar expands, the iFrame grows with it automatically.
   - Native Look: By using hideBg=true, the widget will look like part of your design.
   - Framer Logic: We've optimized the `embed.js` to detect if it's running inside a Framer "isolated" environment (srcdoc) and automatically recover your parent URL parameters using `document.referrer`.

6. Dynamic Deep Linking for Promotions
   You can easily pass specific promotional dates and promo codes into your embedded widget directly from your website's main page URL.

   Example link to your Framer page:
   `https://your-framer-site.com/booking?date=2026-05-17&promo=MAY3RDWEEK#booking-widget`
   
   - `date`: Opens exactly to that specific week on the calendar (YYYY-MM-DD).
   - `promo`: Auto-applies the promo code.
   - `session_id`: Automatically passed through for Stripe checkout returns.

7. Troubleshooting Framer "Double Loading"
   If you see the widget loading twice in your Network tab when using Method 1 (HTML Embed), it's because the `<iframe>` src is being updated by the script. To avoid this, use Method 2 (Code Component).


