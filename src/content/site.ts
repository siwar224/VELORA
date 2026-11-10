// All brand copy lives here. Renaming the brand is a one-line change to `brand.name`.
// VELOR is a concept brand (portfolio project). Coffee origins and tasting notes are
// realistic; the address is illustrative and the email uses a reserved .example domain:
// replace `visit.contact` and `visit.order` with real addresses before launch.

export const brand = {
  name: "VELOR",
  tagline: "Velvet Cold Coffee",
  signature: "Est. 2021 · Paris 11e",
  description:
    "VELOR is a small-batch roastery and cold-coffee bar in Paris. Single-origin espresso poured over slow-frozen clear ice, built one cube at a time.",
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
      body: "Single-origin espresso over fresh milk, built one clear cube at a time.",
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

/** Caramel band between the stage and the story. */
export const marquee = {
  words: ["Cold", "Slow", "Deliberate"],
} as const;

export const story = {
  label: "Our Story",
  heading: "From farm to ice, nothing rushed.",
  intro:
    "VELOR started with one question: why does iced coffee so often taste like an afterthought? We rebuilt it from the bean up. Lighter roasts that open up when cold, ice frozen slow and clear, espresso pulled straight onto it.",
  // Animated counters: `value` counts up, `suffix` is appended.
  counters: [
    { value: 4, suffix: "", label: "Partner farms" },
    { value: 48, suffix: "h", label: "Roast to cup" },
    { value: 10, suffix: "kg", label: "Per roast batch" },
  ],
  steps: [
    {
      title: "Farm",
      body: "Four farms in Ethiopia, Colombia, Kenya and Brazil, bought direct and paid well above market. Picked ripe, rested properly, shipped sealed.",
    },
    {
      title: "Roast",
      body: "Twice a week in a ten-kilo drum. Light enough to keep the fruit, developed enough to stay sweet once it is chilled.",
    },
    {
      title: "Ice",
      body: "Filtered water frozen slowly, top-down, for forty-eight hours. Clear cubes melt slower, so the last sip tastes like the first.",
    },
    {
      title: "Cup",
      body: "Pulled to order and poured straight over the ice, finished with whole or oat milk. In your hands within ninety seconds of the shot.",
    },
  ],
  imageAlt: "Close-up of cold condensation beading on a glass of iced latte.",
} as const;

export type MenuItem = { name: string; note: string; price: string; frame: number };

export const menu = {
  label: "The Menu",
  heading: "Poured cold, written plainly.",
  // `frame` = which sequence frame is used as the preview image.
  tabs: [
    {
      id: "cold",
      label: "Cold",
      items: [
        { name: "Velvet Iced Latte", note: "Double ristretto, whole milk, clear ice. Milk chocolate, hazelnut.", price: "€5.50", frame: 1 },
        { name: "Cold Brew", note: "Eighteen-hour steep, Brazil Cerrado. Cocoa, brown sugar, round body.", price: "€5.20", frame: 90 },
        { name: "Caramel Cortado", note: "Burnt-sugar caramel, short milk, one large cube. Toffee, sea salt.", price: "€5.80", frame: 180 },
        { name: "Espresso Tonic", note: "Ethiopia Yirgacheffe over tonic and orange peel. Bergamot, bright.", price: "€6.00", frame: 267 },
      ],
    },
    {
      id: "espresso",
      label: "Espresso",
      items: [
        { name: "Espresso", note: "Seasonal house blend, 18 g in, 36 g out. Dark chocolate, cherry.", price: "€2.80", frame: 1 },
        { name: "Cortado", note: "Equal parts espresso and steamed milk. Caramel, soft finish.", price: "€3.80", frame: 90 },
        { name: "Flat White", note: "Double ristretto, silky microfoam. Praline, cream.", price: "€4.50", frame: 180 },
        { name: "Filter of the Day", note: "Single origin, brewed by hand. Ask what is on the bar.", price: "€4.20", frame: 267 },
      ],
    },
    {
      id: "beans",
      label: "Beans",
      items: [
        { name: "Ethiopia Yirgacheffe", note: "Washed, 250 g. Jasmine, bergamot, white peach.", price: "€18", frame: 1 },
        { name: "Colombia Huila", note: "Washed, 250 g. Red apple, panela, cocoa nib.", price: "€16", frame: 90 },
        { name: "Kenya Nyeri AA", note: "Washed, 250 g. Blackcurrant, grapefruit, syrupy.", price: "€21", frame: 180 },
        { name: "Brazil Cerrado", note: "Natural, 250 g. Hazelnut, milk chocolate, low acidity.", price: "€14", frame: 267 },
      ],
    },
  ] satisfies { id: string; label: string; items: MenuItem[] }[],
  footnote: "Whole, oat or almond milk at no extra cost. Decaf on request.",
  tapHint: "Tap a drink to see it",
} as const;

export const quote = {
  text: "Most cafés treat iced coffee as hot coffee that got cold. We treat cold as the whole point.",
  author: "Inès Morel",
  role: "Head roaster, VELOR",
} as const;

export const visit = {
  label: "Visit",
  heading: "Come in from the heat.",
  address: ["41 Rue de Charonne", "75011 Paris, France"],
  /** Shop hours, evaluated in this time zone whatever the visitor's own is. */
  timeZone: "Europe/Paris",
  /** Opening hours by weekday (0 = Sunday … 6 = Saturday), 24 h "HH:MM"; null = closed. */
  schedule: {
    0: ["09:00", "17:00"],
    1: ["07:30", "18:30"],
    2: ["07:30", "18:30"],
    3: ["07:30", "18:30"],
    4: ["07:30", "18:30"],
    5: ["07:30", "18:30"],
    6: ["09:00", "19:00"],
  } as Record<number, readonly [string, string] | null>,
  /** How the hours are listed (keep in sync with `schedule`). */
  hours: [
    { days: "Mon – Fri", time: "07:30 – 18:30" },
    { days: "Saturday", time: "09:00 – 19:00" },
    { days: "Sunday", time: "09:00 – 17:00" },
  ],
  status: {
    open: "Open now",
    closed: "Closed",
    until: "until",
    opens: "opens",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  order: { label: "Order ahead", href: "mailto:orders@velor.example?subject=Order%20ahead" },
  contact: { label: "hello@velor.example", href: "mailto:hello@velor.example" },
  newsletter: {
    title: "The Cold Letter",
    body: "One email a month: new origins, seasonal drinks, nothing else.",
    label: "Email address",
    placeholder: "you@example.com",
    button: "Subscribe",
    success: "You're on the list. The first letter lands next month.",
    error: "Please enter a valid email address.",
  },
  smallPrint: "VELOR is a concept brand and portfolio project. Address and contact details are illustrative.",
} as const;
