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
  height="750px"
  scrolling="no" 
  style="border: none; overflow: hidden; min-width: 100%;"
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
   Critical: In Framer, ensure the Embed container height is set to your preferred fixed size (e.g., 750px). The widget is now designed to stay the same size always to prevent layout jumping and scrolling issues.
3. Styling via URL Parameters
   You can "Match Your Website" by changing the parameters in the src URL.

Parameter Example Result
primaryColor %23FF5733 Sets buttons and accents to this Hex code (e.g. #FF5733).
hideBg true Makes the widget background transparent (shows your site's background).
bgColor %23FFFFFF Forces a specific background color inside the widget.
textColor %23222222 Sets the default text color.
fontFamily Inter Overrides the font (must be a standard font or loaded on the page).
Note on Hex Codes: Always replace the # with %23 in the URL (e.g., #000000 → %23000000).

4. Why use this over a simple iFrame?
   Consistent Size: The widget uses an internal scrollable layout that prevents your main website from jumping around or changing height unexpectedly.
   Native Look: By using hideBg=true, the widget won't look like a "box" sitting on your page; it will look like part of your design.
   Context Awareness: The widget automatically detects it is embedded and adds an .is-embedded class to its own body, which we've optimized to remove unnecessary margins/padding.
   Your latest deployment already includes the embed.js file at the root level, so it is ready to be linked!
