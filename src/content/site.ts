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
  /** Rotating circular badge in the hero; clicking it scrolls to the next beat. */
  badge: {
    text: "Cold · Slow · Deliberate · Poured to order · ",
    label: "Scroll to the next chapter",
  },
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
  imageAlt: "The finished iced latte, beaded with cold condensation, on a walnut table.",
} as const;

export type MenuItem = {
  name: string;
  /** Recipe / process line. */
  detail: string;
  /** Tasting notes, shown as tags. */
  notes: string[];
  price: string;
  /** Product photo in /public/menu (served optimised through next/image). */
  image: string;
  alt: string;
  /** CSS object-position keeping the product centred when the photo is cropped (default "50% 45%"). */
  focus?: string;
  /** Photo width ÷ height when not square, so crops request a sharp enough file (default 1). */
  aspect?: number;
  tag?: "Signature" | "Seasonal";
};

export const menu = {
  label: "The Menu",
  heading: "Poured cold, written plainly.",
  tabs: [
    {
      id: "cold",
      label: "Cold",
      items: [
        {
          name: "Velvet Iced Latte",
          detail: "Double ristretto, whole milk, clear ice.",
          notes: ["Milk chocolate", "Hazelnut"],
          price: "€5.50",
          image: "/menu/Cold/Velvet Iced Latte.png",
          alt: "Velvet Iced Latte: espresso swirling into milk over clear ice in a tall glass.",
          focus: "83% 55%", // wide photo, glass on the right
          aspect: 16 / 9,
          tag: "Signature",
        },
        {
          name: "Cold Brew",
          detail: "Eighteen-hour steep, Brazil Cerrado.",
          notes: ["Cocoa", "Brown sugar", "Round body"],
          price: "€5.20",
          image: "/menu/Cold/Cold_Brew.png",
          alt: "Cold brew over ice in a tall glass beaded with condensation.",
        },
        {
          name: "Caramel Cortado",
          detail: "Burnt-sugar caramel, short milk, one large cube.",
          notes: ["Toffee", "Sea salt"],
          price: "€5.80",
          image: "/menu/Cold/Caramel_Cortado.png",
          alt: "Caramel cortado with a single large ice cube in a short glass.",
        },
        {
          name: "Espresso Tonic",
          detail: "Ethiopia Yirgacheffe over tonic and orange peel.",
          notes: ["Bergamot", "Bright", "Sparkling"],
          price: "€6.00",
          image: "/menu/Cold/Espresso_Tonic.png",
          alt: "Espresso tonic: espresso layered over sparkling tonic with ice and orange peel.",
          tag: "Seasonal",
        },
      ],
    },
    {
      id: "espresso",
      label: "Espresso",
      items: [
        {
          name: "Espresso",
          detail: "Seasonal house blend, 18 g in, 36 g out.",
          notes: ["Dark chocolate", "Cherry"],
          price: "€2.80",
          image: "/menu/Espresso/Espresso.png",
          alt: "A double espresso with thick golden crema in a small glass.",
        },
        {
          name: "Cortado",
          detail: "Equal parts espresso and steamed milk.",
          notes: ["Caramel", "Soft finish"],
          price: "€3.80",
          image: "/menu/Espresso/Cortado.png",
          alt: "Cortado with latte art in a short glass.",
        },
        {
          name: "Flat White",
          detail: "Double ristretto, silky microfoam.",
          notes: ["Praline", "Cream"],
          price: "€4.50",
          image: "/menu/Espresso/Flat_White.png",
          alt: "Flat white with rosetta latte art in a ceramic cup and saucer.",
          tag: "Signature",
        },
        {
          name: "Filter of the Day",
          detail: "Single origin, brewed by hand. Ask what is on the bar.",
          notes: ["Changes daily"],
          price: "€4.20",
          image: "/menu/Espresso/Filter_of_the_Day.png",
          alt: "Steaming filter coffee in a speckled stoneware mug.",
        },
      ],
    },
    {
      id: "beans",
      label: "Beans",
      items: [
        {
          name: "Ethiopia Yirgacheffe",
          detail: "Washed · 250 g",
          notes: ["Jasmine", "Bergamot", "White peach"],
          price: "€18",
          image: "/menu/Beans/Ethiopia_Yirgacheffe.png",
          alt: "A 250 g bag of Ethiopia Yirgacheffe beans with roasted beans beside it.",
        },
        {
          name: "Colombia Huila",
          detail: "Washed · 250 g",
          notes: ["Red apple", "Panela", "Cocoa nib"],
          price: "€16",
          image: "/menu/Beans/Colombia_Huila.png",
          alt: "A 250 g bag of Colombia Huila beans with a window showing the roasted beans.",
        },
        {
          name: "Kenya Nyeri AA",
          detail: "Washed · 250 g",
          notes: ["Blackcurrant", "Grapefruit", "Syrupy"],
          price: "€21",
          image: "/menu/Beans/Kenya_Nyeri_AA.png",
          alt: "A 250 g bag of Kenya Nyeri AA beans with roasted beans beside it.",
          tag: "Seasonal",
        },
        {
          name: "Brazil Cerrado",
          detail: "Natural · 250 g",
          notes: ["Hazelnut", "Milk chocolate", "Low acidity"],
          price: "€14",
          image: "/menu/Beans/Brazil Cerrado.png",
          alt: "A bag of Brazil Cerrado beans next to a small bowl of roasted beans.",
          focus: "55% 55%", // landscape photo, bag slightly right of centre
          aspect: 3 / 2,
        },
      ],
    },
  ] satisfies { id: string; label: string; items: MenuItem[] }[],
  footnote: "Whole, oat or almond milk at no extra cost. Decaf on request.",
  tapHint: "Tap a drink to see it",
  notesLabel: "Tasting notes",
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
