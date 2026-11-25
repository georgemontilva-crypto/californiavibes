/**
 * Store policies shown at /terms, /privacy, /shipping and /returns.
 *
 * Plain data so the wording can be edited in one place. Paragraphs are plain
 * text; any email address in them is turned into a mailto link when rendered.
 */
export const POLICY_EMAIL = "sales@mycaliforniavibes.com";
export const POLICY_SITE = "www.mycaliforniavibes.com";

export type Policy = {
  slug: "terms" | "privacy" | "shipping" | "returns";
  title: string;
  subtitle: string;
  sections: { heading: string; body: string[] }[];
};

export const POLICIES: Policy[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    subtitle: "Website use and retail orders",
    sections: [
      {
        heading: "About these terms",
        body: [
          `These terms apply when you use ${POLICY_SITE} or place a retail order through the site. The store is operated by California Vibes. You can reach us at ${POLICY_EMAIL}.`,
        ],
      },
      {
        heading: "Who can order",
        body: [
          "You must be at least 21 to use this site or purchase our products. By placing an order, you confirm that you meet this requirement, that your purchase is lawful at the delivery address, and that you are buying for an eligible adult. We may request age verification and cancel an order if we cannot verify eligibility.",
        ],
      },
      {
        heading: "Orders and payment",
        body: [
          "Please review the product, quantity, delivery address, and total before submitting your order. An order confirmation acknowledges receipt of your request. If an item is unavailable, a listing contains a pricing error, or we cannot fulfill the order at your address, we'll contact you. If we cancel a paid order, we'll refund the canceled items and associated charges. We'll ask for approval before substituting a product or charging a higher price.",
        ],
      },
      {
        heading: "Product information",
        body: [
          "Read the label, warnings, and instructions before use. Keep products out of reach of children and pets. If the item or label differs from what you ordered, contact us before using it.",
        ],
      },
      {
        heading: "Use of the site",
        body: [
          "Provide accurate information and use only payment methods you are authorized to use. California Vibes and its licensors own the site's original photography, artwork, logos, and written content. Obtain written permission before using these materials commercially.",
        ],
      },
      {
        heading: "Wholesale orders",
        body: [
          "Retail purchases are for personal use. Businesses purchasing for resale should apply for a wholesale account. Approved orders are subject to the written terms for that account or order.",
        ],
      },
      {
        heading: "Questions and order issues",
        body: [
          `See our Shipping Policy and Returns & Refunds Policy for delivery, cancellations, and retail order issues. These terms preserve applicable consumer rights. Email ${POLICY_EMAIL} for help.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    subtitle: "Effective October 31, 2026",
    sections: [
      {
        heading: "Who we are",
        body: [
          `California Vibes operates ${POLICY_SITE}. This policy explains how we use personal information when you place an order, contact us, apply for a wholesale account, or subscribe to our newsletter.`,
        ],
      },
      {
        heading: "Orders and customer support",
        body: [
          "We use the contact, billing, shipping, and order details you provide to process your purchase, arrange delivery, send order updates, and handle refunds. When you contact us, we use your message, order number, and any photos you provide to resolve your request.",
        ],
      },
      {
        heading: "Wholesale applications",
        body: [
          "We use the business and contact information you submit to review your application and manage your wholesale account.",
        ],
      },
      {
        heading: "Newsletter and advertising",
        body: [
          `We use your email address for advertising only if you subscribe to the California Vibes newsletter. You can unsubscribe at any time by emailing ${POLICY_EMAIL}. Unsubscribing stops promotional emails. You can still receive updates about orders you place.`,
        ],
      },
      {
        heading: "Third-party sharing",
        body: [
          "We do not sell personal information or share it with third parties for their own advertising.",
        ],
      },
      {
        heading: "Privacy requests",
        body: [
          `To ask about your information or request access, correction, or deletion, email ${POLICY_EMAIL} with the subject "Privacy Request." Include the email address associated with your account or order. We may need to verify your identity. Please wait for instructions before sending identity documents.`,
        ],
      },
      {
        heading: "Age restriction",
        body: [
          `Our store is intended for adults 21 and older. If you believe someone under 21 submitted personal information, please contact ${POLICY_EMAIL}.`,
        ],
      },
    ],
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    subtitle: "Retail orders",
    sections: [
      {
        heading: "Where we ship",
        body: [
          "Delivery availability depends on the products you order and your shipping address. If we discover after checkout that we cannot ship an item to your address, we'll contact you and refund the canceled portion of your order, including associated charges.",
        ],
      },
      {
        heading: "Processing and delivery",
        body: [
          "We process retail orders within one business day. Once the carrier picks up your package, estimated transit time is three business days. Shipping charges are displayed at checkout before you pay.",
        ],
      },
      {
        heading: "If shipment is delayed",
        body: [
          "If we cannot ship by the promised date, we'll email you with an updated date if available. You may agree to wait or cancel the unshipped items for a full refund. If we cannot obtain the consent needed to proceed, we'll cancel the affected items and promptly refund you.",
        ],
      },
      {
        heading: "Address changes and missing packages",
        body: [
          `If you entered the wrong address, email ${POLICY_EMAIL} as soon as possible with your order number and corrected address. We'll confirm whether we can update it before shipment. If tracking shows delivery and you cannot locate your package, contact us with your order number so we can investigate with the carrier.`,
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "Returns & Refunds Policy",
    subtitle: "Retail orders",
    sections: [
      {
        heading: "30-day return window",
        body: [
          `You may request a return within 30 days of delivery. Email ${POLICY_EMAIL} with your order number, the item you wish to return, and the reason for the return. We'll reply with instructions. Please contact us before sending any product back. Your rights under applicable law continue to apply.`,
        ],
      },
      {
        heading: "If something is wrong with your order",
        body: [
          `If an item arrives damaged, defective, incorrect, or missing, email ${POLICY_EMAIL} as soon as you discover the issue. Include your order number, the affected product and quantity, and a brief description. For visible damage or an incorrect item, a photo of the product and packaging helps us identify what happened. If a disposable appears damaged or is leaking, leave it unused and contact us for instructions.`,
        ],
      },
      {
        heading: "How we resolve a problem",
        body: [
          "Once we confirm the issue, we'll offer a replacement at our expense or a refund for the affected item and applicable charges. If we need the product returned, we'll provide instructions and cover authorized return shipping. Please contact us before mailing a disposable device or pre-roll back to us.",
        ],
      },
      {
        heading: "Cancellations",
        body: [
          "Email us promptly with your order number. If the order has not entered fulfillment, we'll cancel it and refund your payment. If fulfillment is underway, we'll check whether we can stop shipment. For an order we cannot ship on time, the cancellation options in our Shipping Policy apply.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "We issue approved refunds to the original payment method and email you when we issue yours. Your bank or payment provider determines when the credit appears on your statement.",
        ],
      },
      {
        heading: "Wholesale purchases",
        body: [
          `For case orders placed through an approved wholesale account, contact your sales representative or ${POLICY_EMAIL} and include your invoice number. The written terms for your wholesale order apply.`,
        ],
      },
    ],
  },
];

export function policyBySlug(slug: string): Policy | undefined {
  return POLICIES.find(p => p.slug === slug);
}
