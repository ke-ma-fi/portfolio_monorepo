# Gutscheineland System Architekture Documentation

**Status**: Living Document
**Version**: 2.0 (Post-Refactor)

---

## 1. High-Level Concepts

### The "No-Login" Philosophy
Gutscheineland operates on a radical **Guest-Only** architecture to minimize friction.
*   **Identity = Possession**: Access to a card is proven by possessing a secret UUID link, not by a password.
*   **Dual-Token System**:
    *   **UUID (`uuid`)**: The "Manager Token". Allows viewing history, downloading PDF, and **forwarding** (gifting) the card. Sent to Buyer.
    *   **Recipient UUID (`recipientUuid`)**: The "Spender Token". **Exclusively used for the QR Code**. This ensures that if a card is gifted (rotating the Recipient UUID), the old QR code becomes invalid immediately.

### The Service Layer Pattern
To prevent "Business Logic Leakage" (logic scattered in UI components or isolated Webhooks), all critical operations flow through a strict Service Layer.

*   **Rule**: `src/services/*.ts` contains the *Brain*. `src/actions/*.ts` and `src/plugins/*.ts` are just *Triggers*.
*   **Example**: `fulfillOrder` is defined ONCE in `src/services/orders.ts`. It is called by:
    1.  `verifyOrderAction` (Client-side success page).
    2.  `stripeWebhooks` (Server-side reliability backup).

---

## 2. Logic Layering & Coding Convention (V2)

### The Service Pattern (Context-Aware)
All business logic must be encapsulated in **Stateless Services** that support Payload’s execution context.

*   **Location:** `src/services/`
*   **Signature:** Services should accept a single **options object**.
*   **The `req` Rule:** Always include an optional `req: PayloadRequest` property in the options object.
*   **Implementation:** Pass this `req` directly into Payload Local API calls (`payload.find`, `payload.create`, etc.). This ensures:
    1.  **Transactions:** DB operations stay within the same atomic session.
    2.  **Locales:** The service respects the requester's language settings.
    3.  **Authentication:** `req.user` is available for hooks/access control.
*   **Naming:** Use `VerbNoun` (e.g., `processOrder`, `syncInventory`).

### The Utility Pattern (Pure)
*   **Location:** `src/utilities/`
*   **Constraint:** Utilities **must not** accept a `req` object.
*   **Criteria:** If a function requires the database or the request context, it is a **Service**, not a Utility.
*   **Purity:** Utilities should be "Pure Functions" (Same input = Same output, no side effects).

### Layered Responsibility Matrix
| Layer | Responsibility | Context (`req`) |
| :--- | :--- | :--- |
| **Transport** (Endpoint/Action) | Parsing headers, validation, HTTP response. | **Originates** the `req`. |
| **Service** | Business rules, DB orchestration, side effects. | **Passes** the `req` through. |
| **Utility** | Data formatting, logic puzzles, math. | **Ignorant** of `req`. |

### Summary "Mantra"
> **"Pass the `req` to keep the transaction; keep logic in the Service to keep your sanity."**

### Service Registry (Implemented)
| Service File | Key Responsibilities | Primary Functions |
| :--- | :--- | :--- |
| `src/services/baseService.ts` | **Foundation**. Helper for context extraction. | `getServicePayload` |
| `src/services/cards.ts` | **Inventory**. Life-cycle management of Gift Cards. | `createCard`, `activateCard`, `markCardAsPrinted`, `getCardsByEmail` |
| `src/services/orders.ts` | **Fulfillment**. Orchestrates payment success -> card creation -> email. | `createCheckoutSession`, `fulfillOrder` |
| `src/services/merchant.ts` | **B2B Logic**. Validation and redemption rules for Companies. | `scanCard`, `redeemCard` |
| `src/services/gifting.ts` | **Social Logic**. Sending, resending, and claiming gifts. | `sendGiftCard`, `resendGiftNotification`, `registerRecipient` |
| `src/services/kiosk.ts` | **POS Interface**. Specific logic for In-Store activation flow. | `activateCardInStore` |
| `src/services/recovery.ts` | **Support**. Loss prevention logic (emailing lost links). | `recoverCards` |
| `src/services/wallet.ts` | **Mobile Wallets**. Generation of digital passes (Google/Apple). | `createGoogleWalletLink` |
| `src/services/billing/` | **Finance**. Fee calculation, transaction recording, invoicing. | `calculateFees`, `createTransaction`, `createInStoreTransaction` |
| `src/services/users.ts` | **Identity**. User sync (Stripe -> User), profile fetching, RBAC checks. | `syncUserWithCompany`, `getPublicUserProfiles` |
| `src/services/posts.ts` | **Content**. CMS logic for posts (cache invalidation). | `revalidatePostCache` |
| `src/services/stripe.ts` | **Payments**. Stripe Connect account management. | `createConnectedAccount`, `getStripeOnboardingLink`, `getStripeLoginLink` |

---

## 3. Core Workflows (Deep Dive)

### A. Online Purchase (Buy for Self)
*   **Trigger**: Stripe Checkout Session Completed.
*   **Execution**:
    1.  **Idempotency Check**: Search `GiftCardTransactions` for `stripeSessionId`. If found -> HALT.
    2.  **CRM**: Find or Create `Customer` by email.
    3.  **Inventory**: Create `GiftCard` (`status: active`, `isPaid: true`, `purchaseContext: online`).
    4.  **Audit**: Create `GiftCardTransaction` (`type: purchase`, `netAmount`, `fee`).
    5.  **Notification**: Send **Receipt Email** to Buyer containing the `uuid` link.

### B. Online Purchase (Direct Gift)
*   **Trigger**: Stripe Session has `metadata.isGift = 'true'`.
*   **Execution**: Same as above, BUT:
    *   **Split Notification**:
        *   **Buyer**: Receives Receipt Email (Confirming purchase, but card is marked "Verschenkt").
        *   **Recipient**: Receives **Gift Email** containing `recipientUuid` link + Personal Message.

### C. Post-Purchase Gifting ("Forwarding")
*   **Context**: You bought a card for yourself, but now want to gift it.
*   **Trigger**: Buyer clicks "Verschenken" in the Manager View (`/view/[uuid]`).
*   **Constraint**: FAILS if `giftedAt` is already set OR `printedAt` is set (Physical Lock).
*   **Engineering Magic (Credential Rotation)**:
    1.  System generates **NEW** `code`.
    2.  System generates **NEW** `recipientUuid`.
    3.  Updates card: `recipientEmail` = Input, `giftedAt` = Now.
    4.  **Result**: Old QR codes (using old `recipientUuid`) become invalid.
    5.  **Notification**: Recipient gets email with NEW `recipientUuid`.

### D. In-Store Purchase (Kiosk Mode)
*   **Phase 1: Generation (Merchant)**
    *   Merchant uses "Create Inactive Card" tool.
    *   Result: `GiftCard` created with `status: inactive`, `printedAt: NOW`.
    *   *Physical Outcome*: A QR Code printed on high-quality paper.
*   **Phase 2: Sale (Customer)**
    *   Customer picks up card, pays Cash/Card at counter.
*   **Phase 3: Activation (Scanner)**
    *   Merchant scans QR with `/scanner` App.
    *   Action: `activateCardAction` (`src/actions/kiosk.ts`).
    *   Logic: Sets `status: active`, `isPaid: true`.
    *   Audit: Logs `activation` transaction (calculating Platform Fee for later invoicing).

### F. User Printing (Home Print)
*   **Context**: Buyer wants to print the card at home to give personally.
*   **Trigger**: Buyer clicks "Ausdrucken" in the Manager View (`/view/[uuid]`) and confirms the warning.
*   **Action**: `markAsPrintedAction` (`src/actions/cards.ts`).
*   **Engineering Magic (Credential Rotation)**:
    1.  **Lock**: Sets `printedAt` to NOW.
    2.  **Rotate**: Generates NEW `code` and `recipientUuid`.
    3.  **Result**: The PDF/Print View gets the *new* valid QR code. Any previous QR codes / digital links become invalid.
    4.  **UX**: The Manager View updates to show "Ausgedruckt" and disables digital gifting to prevent double-spending.

### G. Recovery Loop
*   **Problem**: "I lost my email link."
*   **Trigger**: `/recover` page.
*   **Logic**:
    1.  User enters Email.
    2.  System searches `GiftCards` where `buyer.email` == Input **OR** `recipientEmail` == Input.
    3.  **Security**: Does NOT reveal *which* email matched on screen. "If this email exists...".
    4.  **Email**: Sends a **Digest Email** listing all active cards, separated by "Gekauft" (Bought) and "Erhalten" (Received).

---

## 3. Data Dictionary & Key Fields

### Collection: `GiftCards`
| Field | Type | Purpose |
| :--- | :--- | :--- |
| `uuid` | String (UUID) | **Buyer Access**. Viewing history, downloading PDF. |
| `recipientUuid` | String (UUID) | **Spender Access**. Strictly used for QR generation. Rotates on gifting. |
| `code` | String (8 chars) | Human-readable code (`ABCD-1234`) for manual Merchant entry. |
| `status` | Select | `inactive` (Unpaid), `active` (Redeemable), `redeemed` (Empty). |
| `printedAt` | Date | **The Physical Lock**. Set when a Merchant creates a physical card OR when a User prints at home. Prevents digital gifting. |

### Collection: `GiftCardTransactions`
| Field | Type | Purpose |
| :--- | :--- | :--- |
| `stripeSessionId` | String | **The Idempotency Key**. Prevents processing same order twice. |
| `balanceAfter` | Number | Snapshot of balance *after* this specific event. History log. |
| `platformFee` | Number | Calculated commission causing a liability for the Merchant. |

---

## 4. Engineering Patterns

### Double-Safety Fulfillment
Because Webhooks can be delayed and Client connections can drop, we trigger fulfillment from **both** sides.
*   **Race Condition Handling**: The `stripeSessionId` unique constraint (checked logically via `find`) ensures only the *first* winner processes the order. The second one logs "Already processed" and exits.

### Merchant Context
*   **Auth**: Merchant Dashboard uses Payload Auth (`users` collection).
*   **Scanner**: Protected route using `getAuthenticatedCompanyUser`.
*   **Isolation**: Merchants can only see `GiftCards` and `Transactions` where `ownedBy` matches their User ID.

---

## 5. Active Deployment Stack

*   **Hosting**: Coolify (Self-Hosted PaaS) likely on Hetzner VPS.
*   **Database**: PostgreSQL (Dockerized Sidecar).
*   **Storage**: Local / S3 (depending on media config).
*   **Email**: SMTP Relay (Brevo).

---

## 6. Access & Security Rules
1.  **Public Views**: `/view/[uuid]` requires NO auth, just valid UUID.
2.  **Scanner**: Requires Login + `company` role.
3.  **Admin Panel**: Requires Login + `admin` or `company` role.
4.  **API**: Most endpoints are closed; access is mediated via Server Actions.

---

## 7. Testing Framework

### Strategy
We use a **Dual-Layer Testing Strategy** to ensure both business logic integrity and user experience reliability.

### A. Service Layer Tests (Vitest)
*   **Goal**: Verify the "Brain" of the application (`src/services/`) without the overhead of a browser.
*   **Tools**: `vitest`, `payload` (Local API), `dotenv`.
*   **Location**: `src/services/__tests__/`.
*   **Running**: `pnpm test`.
*   **How to Add**:
    1.  Create a file `src/services/__tests__/yourService.test.ts`.
    2.  Use the `seedTestDb()` helper from `src/tests/helpers/seed.ts` to generate isolated test data (Company + Offer).
    3.  Call your service function directly and assert the database state.

### B. End-to-End Tests (Playwright)
*   **Goal**: Verify the "User Journey" matches expectations (Guest Flows, Printing, Gifting).
*   **Tools**: `@playwright/test`, `tsx` (for seeding).
*   **Location**: `tests/e2e/`.
*   **Running**: `pnpm test:e2e` (Automatically seeds valid data before launch).
*   **How to Add**:
    1.  Create a file `tests/e2e/my-flow.spec.ts`.
    2.  Use `e2e-data.json` (generated by `scripts/seed-e2e.ts`) if you need a valid UUID.
    3.  Remember Next.js caching! If your test modifies data (e.g., clicks "Print"), the page might not update unless the action calls `revalidatePath`.

### CI/CD Integration
*   Ensure `.env` is populated with a `PAYLOAD_SECRET` and `DATABASE_URI` (can be a temporary CI database) before running tests.

### Known Limitations & Future Work
*   **Media Handling**: We rely on Payload's native image resizing. No custom tests are implemented as we use standard configuration.
*   **Payment Validation**: Currently, `fulfillOrder` uses the price from the *Offer*, not the *Stripe Session*. 
    *   **Risk**: A mismatch between Stripe price and Offer price could lead to underpayment.
    *   **Fix**: Add a check: `if (session.amount_total !== offer.price) throw Error`.


