import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * CTRL-BOOK Framer Component
 * A "Gold Standard" embed component that handles dynamic URL parameters,
 * dark mode syncing, and automatic resizing.
 */
export default function CtrlBookWidget(props) {
    const { 
        appUrl, 
        primaryColor, 
        hideBg, 
        bgColor, 
        textColor, 
        fontFamily 
    } = props
    
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // 1. Get the current URL parameters from the visitor's browser address bar
        const searchParams = new URLSearchParams(window.location.search)
        
        // 2. Base Widget URL
        const baseUrl = appUrl.endsWith("/") ? appUrl + "widget" : appUrl + "/widget"
        const url = new URL(baseUrl)
        
        // 3. Add Component Properties to URL
        if (primaryColor) url.searchParams.set("primaryColor", primaryColor)
        if (hideBg) url.searchParams.set("hideBg", "true")
        if (bgColor) url.searchParams.set("bgColor", bgColor)
        if (textColor) url.searchParams.set("textColor", textColor)
        if (fontFamily) url.searchParams.set("fontFamily", fontFamily)
        
        // 4. Auto-detect Dark Mode from Framer environment
        const isDark = document.documentElement.classList.contains("dark") || 
                       document.body.classList.contains("dark")
        if (isDark) url.searchParams.set("darkMode", "true")

        // 5. Pass through ALL current URL parameters (date, promo, session_id, etc.)
        searchParams.forEach((value, key) => {
            url.searchParams.set(key, value)
        })

        // 6. Set Return URL for Stripe (ensures users return to the right Framer page)
        url.searchParams.set("returnUrl", window.location.origin + window.location.pathname)

        // 7. Create the iframe
        const iframe = document.createElement("iframe")
        iframe.src = url.toString()
        iframe.id = "ctrl-book-widget"
        iframe.style.width = "100%"
        iframe.style.height = "800px" // Fallback height until resized
        iframe.style.border = "none"
        iframe.style.overflow = "hidden"
        iframe.style.transition = "height 0.3s ease"
        iframe.scrolling = "no"

        // 8. Handle Auto-Resizing Handshake
        const handleMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'ctrl-book-resize' && e.data.height) {
                iframe.style.height = e.data.height + 'px'
            }
        }
        window.addEventListener('message', handleMessage)

        if (containerRef.current) {
            containerRef.current.innerHTML = ""
            containerRef.current.appendChild(iframe)
        }

        return () => window.removeEventListener('message', handleMessage)
    }, [appUrl, primaryColor, hideBg, bgColor, textColor, fontFamily])

    return (
        <div 
            ref={containerRef} 
            style={{ 
                width: "100%", 
                height: "100%", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "flex-start",
                overflow: "hidden"
            }} 
        />
    )
}

// Add controls for easy customization in Framer
addPropertyControls(CtrlBookWidget, {
    appUrl: {
        type: ControlType.String,
        title: "App URL",
        defaultValue: "https://sbsce3vy25.us-east-1.awsapprunner.com",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
    },
    hideBg: {
        type: ControlType.Boolean,
        title: "Hide Background",
        defaultValue: true,
    },
    bgColor: {
        type: ControlType.Color,
        title: "BG Color",
        hidden: (props) => props.hideBg,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter",
    },
})
