export const BRAND_NAME = "Ember & Bun"

export const NAV_LINKS = [
  { href: "#exploded-section", label: "Ingredients" },
  { href: "#menu", label: "Menu" },
  { href: "#craft", label: "Our Craft" },
  { href: "#reviews", label: "Reviews" },
  { href: "#visit", label: "Visit" },
]

export const STORE_ADDRESS = "214 Ember Lane, Brooklyn, NY 11211"
export const STORE_TIME_ZONE = "America/New_York"
export const STORE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_ADDRESS)}`

// 24h clock in STORE_TIME_ZONE, not the visitor's local time.
export const STORE_HOURS = [
  { day: "Sunday", open: 12, close: 21 },
  { day: "Monday", open: 11, close: 22 },
  { day: "Tuesday", open: 11, close: 22 },
  { day: "Wednesday", open: 11, close: 22 },
  { day: "Thursday", open: 11, close: 22 },
  { day: "Friday", open: 11, close: 24 },
  { day: "Saturday", open: 11, close: 24 },
]

// The 3D model is CC BY 4.0, which requires visible attribution.
export const MODEL_CREDIT = {
  title: "Burger Realistic (Free)",
  author: "erebus3d",
  sourceUrl:
    "https://sketchfab.com/3d-models/burger-realistic-free-18e59d7dbd2243c69f469e0f056f44c4",
  licenseUrl: "http://creativecommons.org/licenses/by/4.0/",
}
