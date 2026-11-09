# Free shipping

Orders qualify at **$100 USD or more in merchandise after discounts, before shipping**. The shared threshold and cents-based comparison live in `lib/shippingPolicy.ts`.

- All active delivery methods retain their delivery estimates and become free when the order qualifies.
- Changing quantities or bundle discounts immediately updates product-page progress, cart surfaces, delivery options, and checkout totals.
- Below the threshold, the chosen delivery method's current rate applies. Before selection, shipping is marked pending, with a total before shipping.
- Checkout reloads authoritative product prices and the active shipping method. Client-supplied prices or shipping totals cannot grant free shipping. The effective shipping cost is used for the saved order, response, and confirmation email.
- Promotional text explicitly identifies USD. The existing currency selector is presentation-only, not an exchange-rate conversion; it does not change qualification.

Run `npm run test:shipping` for boundary, discount, validation, and mocked checkout tests. These tests do not connect to the database, place orders, change inventory, or send email.
