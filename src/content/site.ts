// All brand copy lives here. Renaming the brand is a one-line change to `brand.name`.
// Placeholder content: fictional brand, address and prices.

export const brand = {
  name: "EMBER",
  tagline: "Specialty Coffee Roasters",
  description:
    "EMBER roasts small-lot coffee and pours it cold, slow and precise. Single-origin iced lattes, made to order.",
} as const;

export const nav = {
  links: [
    { label: "Story", href: "#story" },
    { label: "Menu", href: "#menu" },
    { label: "Visit", href: "#visit" },
  ],
  cta: { label: "Order ahead", href: "#visit" },
} as const;

/** The three text beats that sit over the scroll-scrubbed frame sequence. */
export const stage = {
  // Read by screen readers instead of the decorative canvas.
  canvasDescription:
    "An iced latte on a walnut table. Ice cubes drop into the glass and throw up a splash of coffee and milk, the drink settles into slow swirls, and cold condensation runs down the outside of the glass.",
  beats: [
    {
      id: "arrival",
      label: "The Arrival",
      heading: "Cold, slow, deliberate.",
      body: "Single-origin espresso over fresh milk, built one cube at a time.",
      cta: { label: "Discover more", href: "#story" },
    },
    {
      id: "pour",
      label: "The Pour",
      heading: "Crafted in motion.",
      body: "Ice meets espresso at speed. The splash is the point: it opens the aroma before the first sip.",
    },
    {
      id: "finish",
      label: "The Finish",
      heading: "Worth savouring.",
      body: "Settled, chilled, beaded with cold. Exactly as it should reach you.",
      cta: { label: "See the menu", href: "#menu" },
    },
  ],
} as const;

export const story = {
  label: "Our Story",
  heading: "Roasted in small batches. Poured without hurry.",
  columns: [
    "We buy green coffee from four farms we know by name, and roast it twice a week in a ten-kilo drum. Nothing sits on a shelf long enough to go flat.",
    "Every iced drink is pulled to order and poured over clear, slow-frozen ice that melts on our schedule, not yours. Less water, more coffee, all the way down.",
  ],
  stats: [
    { value: "4", label: "Partner farms" },
    { value: "48h", label: "Roast to cup" },
    { value: "10kg", label: "Drum roaster" },
  ],
} as const;

export const menu = {
  label: "The Menu",
  heading: "Poured cold.",
  // `frame` picks which sequence frame is cropped as the card image.
  items: [
    {
      name: "Iced Latte",
      notes: "Double espresso, whole milk, clear ice.",
      price: "€5.20",
      frame: 1,
    },
    {
      name: "Caramel Cortado",
      notes: "Burnt-sugar caramel, short milk, one large cube.",
      price: "€5.60",
      frame: 110,
    },
    {
      name: "Oat Cold Brew",
      notes: "Eighteen-hour steep, oat milk, a pinch of salt.",
      price: "€5.40",
      frame: 200,
    },
    {
      name: "Espresso Tonic",
      notes: "Washed Ethiopia over tonic and orange peel.",
      price: "€5.80",
      frame: 326,
    },
  ],
} as const;

export const visit = {
  label: "Visit",
  heading: "Come in from the heat.",
  address: ["12 Rue des Torréfacteurs", "75011 Paris"],
  hours: [
    { days: "Mon – Fri", time: "7:30 – 18:00" },
    { days: "Sat – Sun", time: "9:00 – 17:00" },
  ],
  contact: { label: "hello@ember.example", href: "mailto:hello@ember.example" },
  smallPrint: "Fictional brand. Placeholder address, hours and prices.",
} as const;
