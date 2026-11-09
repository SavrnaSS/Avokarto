export type SellerGuide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  published: string;
  updated: string;
  minutes: number;
  sections: { id: string; title: string; paragraphs: string[]; checklist?: string[] }[];
};

/** Original editorial content. Change updated only after a substantive edit. */
export const SELLER_GUIDES: SellerGuide[] = [
  {
    slug: "how-to-start-dropshipping",
    title: "How to start dropshipping with a focused first store",
    seoTitle: "How to Start Dropshipping: Launch Checklist",
    description: "A practical dropshipping launch checklist: choose an audience, evaluate products, budget for costs, build your store and plan your first product content.",
    published: "2026-11-07", updated: "2026-11-07", minutes: 5,
    sections: [
      { id: "understand-the-model", title: "Understand what you are starting", paragraphs: [
        "Dropshipping is a way to sell products without holding the inventory yourself. A customer buys from your store and a fulfilment partner handles the physical order. On Avokarto, you select products from the catalog, choose your selling margin and build a branded store. Avokarto holds stock, packs and ships customer orders.",
        "The work you take on is choosing an offer and bringing relevant shoppers to it. A store does not create demand by itself. Before launching, understand the subscription, product pricing, any platform fee, shipping rules, returns and the conditions for withdrawing earnings. Keep a budget you can measure against actual results.",
      ] },
      { id: "choose-an-audience", title: "Choose an audience before a store name", paragraphs: [
        "Start with a group of people whose needs you understand. A pet owner looking for practical accessories has different questions from someone buying a novelty gift. Write down the situation in which someone would use your product and the reason they might choose it over an alternative.",
        "That short description becomes a filter for your catalog and your content. A small collection with a clear purpose is easier to explain than a storefront of unrelated items. Give the store a name that fits the collection, then choose a theme and branding that stay readable on a phone.",
      ] },
      { id: "review-products", title: "Check the product details and economics", paragraphs: [
        "Review the actual product page before adding an item. Look at photos, dimensions, options, stock, base price and any usage limitations. Do not fill missing details with guesses. Ask support when an important fact is unclear, and avoid promoting an item until you can explain it accurately.",
        "Work out what a sale would contribute after the catalog cost and applicable fees. Then account for your subscription and any marketing spending. Returns and cancellations can reverse earnings, and delivery and the return window affect when a balance becomes withdrawable. Revenue, profit and available cash are different numbers.",
      ] },
      { id: "launch-checklist", title: "Review the store before sharing it", paragraphs: [
        "Build your store, add the initial collection and review every public page. Check the name, logo, product selection and selling prices. Open the store on a phone as a visitor would. Confirm that product links reach the intended pages and that store branding is clear in the cart and checkout.",
      ], checklist: ["Review plan pricing and the trial end date before subscribing.", "Confirm product details, availability and selling prices.", "Check the published shipping and return information.", "Prepare one clear product demonstration and its matching store link.", "Use real traffic and order data to decide what to improve next."] },
      { id: "first-content", title: "Make the first content useful", paragraphs: [
        "Use a product reel to explain one real use, feature or common question. Show the product clearly and link to the page for that item. Do not promise guaranteed results or an income figure. Review the clip, caption and destination together so shoppers see the same offer throughout.",
        "Publish a manageable amount of content, listen to the questions it attracts and improve your product pages and selection. More views do not automatically mean more orders. Start with a test you can learn from and expand when your own results support the decision.",
      ] },
    ],
  },
  {
    slug: "choose-dropshipping-products",
    title: "How to choose dropshipping products you can explain and support",
    seoTitle: "How to Choose Dropshipping Products",
    description: "Evaluate dropshipping products using audience fit, accurate product information, stock, pricing and useful demonstrations before adding them to your store.",
    published: "2026-11-07", updated: "2026-11-07", minutes: 4,
    sections: [
      { id: "start-with-use", title: "Start with a use, not a trend label", paragraphs: [
        "A product is easier to sell when you can describe who it helps and why. Write a one-sentence use case before judging a product by its appearance or popularity. For a pet accessory, that might mean a specific carrying need or an outfit for an occasion. The use case should come from what the item actually does.",
        "Words such as winning or trending are a starting point for research, not a promise that an item will sell in your store. A useful product still needs the right audience, understandable content, a competitive offer and reliable fulfilment. Choose a few candidates you can compare carefully.",
      ] },
      { id: "inspect-information", title: "Inspect the information a customer needs", paragraphs: [
        "Read the full description and inspect the available gallery. Check dimensions, material, size and color options, compatibility and any instructions. Ask what someone would need to know before paying. If an answer is missing, do not make one up in a caption or advertisement.",
        "Use only product imagery and claims you are allowed to share. A reel should show the item that arrives, not an enhanced version or a feature the listing does not support. Clear explanations can also reduce avoidable questions after a sale.",
      ], checklist: ["Can you explain the main use in one sentence?", "Are sizes, options and limitations clear?", "Do the images match the description?", "Can you answer likely questions without guessing?"] },
      { id: "stock-and-price", title: "Check stock, price and the whole offer", paragraphs: [
        "Review current stock before planning a campaign. Availability can change, so check again before directing new traffic to the store. Evaluate the base price together with the margin you can set, the current platform rules and the customer's final order costs.",
        "A large price difference is not automatically a good business opportunity. Compare the offer with realistic alternatives and consider your subscription, marketing budget and the effect of returns. Favor a price you can explain through the product's actual features and service.",
      ] },
      { id: "test-small", title: "Build a small collection and learn", paragraphs: [
        "Group products around an audience or occasion instead of adding everything available. Give each candidate a clear place in the store. If two items solve the same problem, decide what makes each choice different rather than relying on similar photos and names.",
        "After launch, track what people view, ask about and order. Compare those signals with stock and your costs. Keep a short record of changes to prices, videos and product selection so you can understand what happened. Remove or revise weak offers based on evidence from your own store.",
      ] },
    ],
  },
  {
    slug: "price-dropshipping-products",
    title: "How to price dropshipping products and understand your margin",
    seoTitle: "Dropshipping Pricing: Markup, Fees & Profit",
    description: "Understand catalog cost, markup, platform fees and payout timing with a worked dropshipping pricing example and a checklist for reviewing your selling price.",
    published: "2026-11-07", updated: "2026-11-07", minutes: 5,
    sections: [
      { id: "separate-the-numbers", title: "Separate selling price, markup and profit", paragraphs: [
        "Your selling price is the amount assigned to the product in your store. The catalog price is its starting cost before your markup. On Avokarto, the margin control adds either a percentage or a fixed amount to that base within the current marketplace rules. Check the dashboard calculation before publishing a price.",
        "A markup percentage is measured against the base cost. A gross margin percentage is measured against the retail price. They are different calculations, even when a dashboard uses the everyday word margin for the amount you add. Keep the dollar amounts visible so the terminology does not hide the result.",
      ] },
      { id: "worked-example", title: "Work through one product in dollars", paragraphs: [
        "Suppose a product has a $20 catalog price and you add a 30% markup. The markup is $6, so the product selling price is $26. Before other costs, that $6 is about 23.1% of the $26 selling price. A 30% markup does not mean you keep 30% of the retail price.",
        "If the applicable platform fee were 10% of that $6 markup, the fee would be $0.60 and the contribution after that fee would be $5.40. These are hypothetical figures for explaining the calculation. Use the actual fee and limits shown in your own dashboard; do not assume this example is the current store policy.",
      ] },
      { id: "include-business-costs", title: "Include costs beyond the product", paragraphs: [
        "A positive contribution from one order is not the same as overall business profit. Your subscription and any advertising, creative work or other business expenses still need to be covered. Shipping charges, discounts and taxes also need to be understood in the context of the final order and your responsibilities.",
        "For example, if a test costs $27 and each completed order contributes $5.40 after the applicable fee, five such orders would cover that test cost alone. That calculation excludes the subscription and other expenses. It is a planning example, not a forecast of orders or a reason to increase your spending.",
      ] },
      { id: "payout-timing", title: "Plan for when earnings become available", paragraphs: [
        "An order can appear in your dashboard before its earnings are available to withdraw. Delivery, the return window and the minimum payout affect timing. Cancelled and refunded orders can reverse the margin. Use the available balance when planning withdrawals, rather than the total sales figure.",
        "Review order status and payout records together. If a number looks wrong, collect the order reference and ask support before changing prices or making a spending decision. A clear record helps you distinguish a pricing problem from a timing or refund adjustment.",
      ] },
      { id: "pricing-checklist", title: "Review the offer before changing a price", paragraphs: [
        "Compare the price with what your audience receives: the actual product, clear information and the published service terms. Do not create an artificial discount by inventing a previous price. When you make a meaningful price change, review the product page and promotional content together so they describe the same offer.",
      ], checklist: ["Confirm the live catalog cost and available stock.", "Check your markup, fee and final selling price in the dashboard.", "Include subscription and marketing costs in your budget.", "Account for cancellations, returns and payout timing.", "Use genuine order results to reassess the offer."] },
    ],
  },
];

export function getSellerGuide(slug: string) {
  return SELLER_GUIDES.find((guide) => guide.slug === slug);
}
