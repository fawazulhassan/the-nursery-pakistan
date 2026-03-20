# Leafy Luxe Pre-Launch Checklist

**E-Commerce Website - Production Readiness Review**

This document organizes all essential tasks needed before launching the plant e-commerce website. Tasks are divided into discrete, integratable units so you can complete them one by one.

---

## How to Use This Document

1. **Work in priority order**: Complete Critical tasks first, then High, then Medium, then Optional.
2. **One task at a time**: Finish each task fully before moving to the next.
3. **Run test cases**: After completing a task, run the test cases and mark Pass/Fail.
4. **Check off criteria**: Use the acceptance criteria checkboxes to verify completion.
5. **Update completed items**: Move finished tasks to the "Completed Items" section at the top.

---

## Overview

- **Critical (Must Fix)**: Security, payment, legal pages, order emails.
- **High Priority**: UX improvements, SEO basics, business pages.
- **Medium Priority**: Enhancements, analytics, performance.
- **Optional**: Nice-to-have features.

---

## Completed Items (Verify Only)

These items are implemented. Verify they work correctly:

| Item | Status | Verification Task |
|------|--------|-------------------|
| RLS policies | Done | See [docs/RLS_AUDIT.md](docs/RLS_AUDIT.md), migration `20260214000000_rls_audit_and_documentation.sql` |
| Mobile responsiveness | Done | See [RESPONSIVE.md](RESPONSIVE.md) and Task T3.6 |
| Product search | Done | SearchPage with name/description search |
| Categories | Done | Indoor, Outdoor, Pots, Fertilizers, Sale |
| COD payment option | Done | CheckoutPage has Cash on Delivery |
| 404 page | Done | NotFound page exists |
| Plant Care Guide | Done | GuidePage exists |

---

## Section 1: Security and Authentication

### Task T1.1: Audit and Tighten RLS Policies

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
RLS is already enabled on profiles, user_roles, products, orders, order_items, delivery_addresses. Audit all policies to ensure users cannot access other users' data. Add admin-only checks where needed. Ensure no table is missing RLS.

**Acceptance criteria:**
- [x] All tables with user data have RLS enabled
- [x] Non-admin users cannot read/update other users' profiles, orders, addresses
- [x] Admin policies correctly check user_roles table
- [x] Document which tables use RLS in a comment or migration

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Log in as User A; try to fetch User B's orders via API | Should return empty or 403 | |
| 2 | Log in as non-admin; call admin-only Supabase function | Should be denied | |
| 3 | Log in as admin; view all orders | Should succeed | |
| 4 | Run `SELECT * FROM pg_policies` in Supabase SQL editor | All sensitive tables have policies | |

**Files to modify:** `supabase/migrations/*.sql`, new migration file

---

### Task T1.2: Secure Admin Routes (Backend)

**Priority:** Critical  
**Estimated effort:** Small

**Description:**  
Frontend has ProtectedRoute for /admin. Add backend RLS policies or Edge Functions that verify user_roles before allowing admin operations. Prevent non-admins from calling admin-only RPCs or mutations.

**Acceptance criteria:**
- [ ] Admin RPCs/functions check user_roles before execution
- [ ] Direct API calls as non-admin to admin endpoints fail

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Use Supabase client as non-admin; call admin product insert | Should fail with RLS or function error | |
| 2 | Use Supabase client as admin; call admin product insert | Should succeed | |

**Files to modify:** `supabase/migrations/*.sql`, RPC definitions

---

### Task T1.3: Validate File Uploads

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Add validation for product image uploads: max 5MB, allowed types (.jpg, .png, .webp). Optionally add virus scanning. Reject invalid uploads with clear error messages.

**Acceptance criteria:**
- [ ] File size limit 5MB enforced (client and server)
- [ ] Only .jpg, .png, .webp allowed
- [ ] User sees clear error if upload rejected

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Upload 6MB image | Rejected with size error | |
| 2 | Upload .pdf or .exe | Rejected with type error | |
| 3 | Upload valid 2MB .png | Accepted | |
| 4 | Upload 1MB .webp | Accepted | |

**Files to modify:** Admin product upload component, Supabase storage policies, Edge Function if server-side validation

---

### Task T1.4: Enable Email Verification

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Enable email verification in Supabase Auth settings. New users must verify email before full access. Prevents fake accounts.

**Acceptance criteria:**
- [ ] Supabase Auth > Email Auth > Confirm email enabled
- [ ] New user receives verification email
- [ ] Unverified user sees "Verify your email" message

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Sign up with new email | Verification email sent | |
| 2 | Try to checkout without verifying | Blocked or prompted to verify | |
| 3 | Click verification link | Email confirmed, can proceed | |

**Files to modify:** Supabase Dashboard, optionally `src/pages/AuthPage.tsx` for UX

---

### Task T1.5: Test Password Reset Flow

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Thoroughly test forgot password. Ensure reset links expire and can only be used once. Fix any bugs.

**Acceptance criteria:**
- [ ] Forgot password sends email
- [ ] Reset link expires after set time (e.g., 1 hour)
- [ ] Link invalid after use
- [ ] Success message after reset

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Request password reset | Email received with link | |
| 2 | Use link after 2 hours | Expired error | |
| 3 | Use same link twice | Second use fails | |
| 4 | Reset successfully | Can log in with new password | |

**Files to modify:** Supabase Auth config, `src/pages/AuthPage.tsx` if needed

---

### Task T1.6: Add Rate Limiting

**Priority:** Medium  
**Estimated effort:** Medium

**Description:**  
Add rate limiting to login, signup, checkout to prevent brute force and abuse. Use Supabase Edge Functions or a proxy (e.g., Cloudflare).

**Acceptance criteria:**
- [ ] Login limited (e.g., 5 attempts per 15 min per IP)
- [ ] Signup limited per IP
- [ ] Checkout limited per user/session

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Attempt 10 failed logins in 1 min | Blocked after threshold | |
| 2 | Wait 15 min | Can try again | |

**Files to modify:** Supabase Edge Functions, or Cloudflare/config

---

## Section 2: Data Management and Privacy

### Task T2.1: Privacy Policy Page

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Create a Privacy Policy page covering: data collection, usage, storage duration, third-party sharing (Supabase), user rights, contact. Link in footer.

**Acceptance criteria:**
- [ ] Dedicated /privacy route
- [ ] Covers required topics
- [ ] Link in footer on every page
- [ ] Mobile-friendly layout

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Navigate to /privacy | Page loads, content readable | |
| 2 | Click footer Privacy link | Same page | |
| 3 | View on mobile | No horizontal scroll | |

**Files to modify:** `src/pages/PrivacyPage.tsx` (new), `src/App.tsx`, `src/components/Footer.tsx`

---

### Task T2.2: Terms and Conditions Page

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Create T&C page covering: order acceptance, pricing, delivery terms, return policy reference, product quality guarantees, dispute resolution for Pakistan.

**Acceptance criteria:**
- [ ] Dedicated /terms route
- [ ] Covers required topics
- [ ] Link in footer

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Navigate to /terms | Page loads | |
| 2 | Click footer Terms link | Same page | |

**Files to modify:** `src/pages/TermsPage.tsx` (new), `src/App.tsx`, `src/components/Footer.tsx`

---

### Task T2.3: Cookie Consent Banner

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Add cookie consent banner if using analytics (GA, Facebook Pixel). Store consent in localStorage. Block analytics until consent given.

**Acceptance criteria:**
- [ ] Banner appears on first visit
- [ ] Accept/Decline buttons
- [ ] Preference stored
- [ ] Does not show again after choice

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | First visit (clear storage) | Banner visible | |
| 2 | Click Accept | Banner hides, analytics load | |
| 3 | Refresh | Banner does not reappear | |
| 4 | Clear storage, visit again | Banner reappears | |

**Files to modify:** New `CookieBanner.tsx`, layout/wrapper component

---

### Task T2.4: Product Descriptions Enhancement

**Priority:** Critical  
**Estimated effort:** Large (content)

**Description:**  
All products need detailed descriptions: plant care, light, watering, soil, mature size, toxicity (pets/children). Audit existing products and add missing info.

**Acceptance criteria:**
- [ ] Each product has care instructions
- [ ] Light and watering mentioned
- [ ] Toxicity noted where relevant

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Open 5 random product pages | All have descriptions | |
| 2 | Check toxic plants | Warning visible | |

**Files to modify:** Database/products (Admin), product schema if new fields

---

### Task T2.5: Product Image Quality and Alt Text

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Ensure images: min 800x800px, well-lit, actual product. Add alt text for SEO and accessibility.

**Acceptance criteria:**
- [ ] Images meet size minimum
- [ ] Alt text on all product images
- [ ] No broken image links

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Inspect product images | Dimensions adequate | |
| 2 | Check img alt attributes | All have descriptive alt | |
| 3 | Disable images | Alt text visible | |

**Files to modify:** Admin upload flow, product components, DB

---

### Task T2.6: Fix Price Parsing in Cart

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Fix CartContext to handle 'Rs 1,200.50' format correctly with decimals. Ensure totals calculate accurately.

**Acceptance criteria:**
- [ ] Prices with decimals parse correctly
- [ ] Cart total matches sum of items
- [ ] Checkout total correct

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Add product with Rs 1,500.50 | Cart shows correct price | |
| 2 | Add 2 items | Total = item1 + item2 | |
| 3 | Proceed to checkout | Total matches cart | |

**Files to modify:** `src/context/CartContext.tsx`

---

### Task T2.7: Extend Category System

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Add categories if needed: Succulents, Flowering Plants, Soil Types, etc. Update constants and enable filtering on product lists.

**Acceptance criteria:**
- [ ] New categories in `lib/constants.ts`
- [ ] Products filterable by category
- [ ] Navbar/category pages show new categories

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Filter by Succulents | Only succulents show | |
| 2 | Navigate /category/succulents | Page loads with products | |

**Files to modify:** `src/lib/constants.ts`, category filter logic

---

### Task T2.8: Product Search Filters

**Priority:** Medium  
**Estimated effort:** Medium

**Description:**  
Enhance search with filters: price range, category, light requirements, care level, pet-safe.

**Acceptance criteria:**
- [ ] Price filter on search results
- [ ] Category filter
- [ ] Other filters if schema supports

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Search "plant", filter Under Rs 1500 | Results within range | |
| 2 | Filter by category | Results match category | |

**Files to modify:** `src/pages/SearchPage.tsx`, product schema

---

## Section 3: Checkout and Order Processing

### Task T3.1: Integrate Payment Gateway

**Priority:** Critical  
**Estimated effort:** Large

**Description:**  
COD exists. Integrate online payment: JazzCash, EasyPaisa, or bank gateway. Redirect to payment, handle callback, update order status.

**Acceptance criteria:**
- [ ] User can select online payment
- [ ] Redirects to payment provider
- [ ] Callback updates payment_status
- [ ] Order confirmation reflects payment

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Select Online Payment, Place Order | Redirects to gateway | |
| 2 | Complete payment (test mode) | Returns to site, order marked paid | |
| 3 | Cancel payment | Returns, order unpaid or cancelled | |

**Files to modify:** `src/pages/CheckoutPage.tsx`, Supabase functions, payment provider integration

---

### Task T3.2: Order Confirmation Emails

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Set up Supabase Edge Functions + Resend/SendGrid to send: order confirmation, payment confirmation, shipping notification, delivery confirmation.

**Acceptance criteria:**
- [ ] Email sent on order creation
- [ ] Email includes order details, items, total
- [ ] Shipping email when status changes
- [ ] Emails not marked as spam

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Place COD order | Confirmation email received | |
| 2 | Admin marks shipped | Shipping email received | |
| 3 | Check spam folder | Not in spam | |

**Files to modify:** `supabase/functions/*`, email template

---

### Task T3.3: Delivery Charges

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Add shipping cost calculation: by city (e.g., Lahore local vs other), weight, or order value (e.g., free above Rs 3000). Show before checkout.

**Acceptance criteria:**
- [ ] Shipping cost shown in cart or checkout
- [ ] Logic documented (city/weight/value)
- [ ] Free shipping threshold if applicable
- [ ] Total includes shipping

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Cart Rs 2000, Lahore | Shows shipping cost | |
| 2 | Cart Rs 3500 | Free shipping if threshold met | |
| 3 | Different city | Different shipping if applicable | |

**Files to modify:** `src/pages/CartPage.tsx`, `src/pages/CheckoutPage.tsx`, shipping logic

---

### Task T3.4: Order Tracking and Status

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Order status flow: Pending → Confirmed → Packed → Shipped → Delivered. Add tracking number field. Show status on order detail page.

**Acceptance criteria:**
- [ ] Status enum/options in DB
- [ ] Admin can update status and tracking number
- [ ] User sees status + tracking on My Orders

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Admin updates to Shipped, adds tracking | Saved | |
| 2 | User views order | Status and tracking visible | |

**Files to modify:** DB schema, AdminOrdersPage, MyOrdersPage, AccountPage

---

### Task T3.5: Minimum Order Value

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Set minimum order Rs 500 (or chosen amount). Show warning in cart if below. Block checkout if below minimum.

**Acceptance criteria:**
- [ ] Warning when cart below minimum
- [ ] Checkout disabled or blocked with message
- [ ] Minimum value configurable

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Cart total Rs 300 | Warning shown | |
| 2 | Click checkout | Blocked with message | |
| 3 | Add items to reach Rs 600 | Warning gone, checkout allowed | |

**Files to modify:** `src/pages/CartPage.tsx`, `src/pages/CheckoutPage.tsx`

---

### Task T3.6: Verify Mobile Responsiveness

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Mobile responsiveness is implemented. Verify on real devices per [RESPONSIVE.md](RESPONSIVE.md). Fix any layout or tap target issues.

**Acceptance criteria:**
- [ ] Product grid 2 cols on mobile
- [ ] Navbar hamburger works
- [ ] Cart and checkout usable
- [ ] Tap targets at least 44px

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Open site at 375px width | No horizontal scroll | |
| 2 | Browse products, add to cart | Flow works | |
| 3 | Complete checkout on mobile | Success | |
| 4 | Test on real Android/iOS | Usable | |

**Files to modify:** CSS/components if issues found

---

### Task T3.7: Guest Checkout Option

**Priority:** High  
**Estimated effort:** Large

**Description:**  
Allow purchase without account. Collect name, phone, address, email. Create order. Offer account creation after purchase with order link.

**Acceptance criteria:**
- [ ] Checkout accessible without login
- [ ] Form collects required fields
- [ ] Order created and linked to guest email
- [ ] Post-purchase option to create account

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Add to cart, go to checkout (logged out) | Checkout form shown | |
| 2 | Fill form, place order | Order created | |
| 3 | Enter email, get order link | Can view order status | |

**Files to modify:** `src/App.tsx`, `src/pages/CheckoutPage.tsx`, order schema (guest orders)

---

### Task T3.8: Address and Phone Validation

**Priority:** Medium  
**Estimated effort:** Small

**Description:**  
Validate delivery form: required fields, Pakistan phone format (+92...), complete address. Show inline errors.

**Acceptance criteria:**
- [ ] All required fields validated
- [ ] Phone format validated
- [ ] Clear error messages
- [ ] Form does not submit if invalid

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Submit with empty phone | Error shown | |
| 2 | Enter invalid phone (e.g. 123) | Error shown | |
| 3 | Enter +92 300 1234567 | Accepted | |

**Files to modify:** `src/pages/CheckoutPage.tsx`

---

### Task T3.9: Loading States and Duplicate Submit Prevention

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Add loading spinners for: product fetch, cart updates, checkout, image uploads. Disable submit button during processing to prevent duplicate orders.

**Acceptance criteria:**
- [ ] Spinner on product load
- [ ] Spinner on add to cart
- [ ] Checkout button disabled during submit
- [ ] No double order on double click

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Slow network, add to cart | Spinner visible | |
| 2 | Double-click Place Order | Only one order created | |
| 3 | Upload product image | Progress/spinner shown | |

**Files to modify:** Various pages, CartContext, CheckoutPage

---

### Task T3.10: User-Friendly Error Messages

**Priority:** Medium  
**Estimated effort:** Small

**Description:**  
Replace generic errors with clear messages: "This item is out of stock" instead of "Stock validation failed". Add recovery actions where possible.

**Acceptance criteria:**
- [ ] Stock errors are clear
- [ ] Network errors have retry option
- [ ] Form errors are inline and specific

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Add out-of-stock item to cart, checkout | Message: "X is out of stock" | |
| 2 | Simulate network error | Retry or friendly message | |

**Files to modify:** Error handling in CartContext, CheckoutPage, useToast usage

---

### Task T3.11: Breadcrumb Navigation

**Priority:** Medium  
**Estimated effort:** Small

**Description:**  
Add breadcrumbs: Home > Indoor Plants > Snake Plant. Helps navigation and SEO.

**Acceptance criteria:**
- [ ] Breadcrumbs on category page
- [ ] Breadcrumbs on product page
- [ ] Links work correctly

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Open product page | Breadcrumb: Home > Category > Product | |
| 2 | Click Home in breadcrumb | Navigates to / | |

**Files to modify:** New Breadcrumb component, CategoryPage, ProductPage

---

## Section 4: SEO and Marketing

### Task T4.1: Meta Tags per Page

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Add unique title (50-60 chars) and meta description (150-160 chars) per page. Include keywords: "buy plants online Lahore Pakistan", "indoor plants delivery".

**Acceptance criteria:**
- [ ] Each route has unique title
- [ ] Each route has meta description
- [ ] Keywords included naturally

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | View page source on homepage | Title and meta present | |
| 2 | View product page source | Product-specific title | |
| 3 | Google search snippet preview | Reads well | |

**Files to modify:** `index.html`, React Helmet or similar, or Vite meta plugin

---

### Task T4.2: Structured Data (Schema.org)

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Add Product schema JSON-LD on product pages: name, image, price, availability, rating (if any).

**Acceptance criteria:**
- [ ] Product schema on product pages
- [ ] Valid per Google Rich Results Test

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | View product page source | JSON-LD script present | |
| 2 | Test in Google Rich Results | No errors | |

**Files to modify:** ProductPage.tsx, or layout component

---

### Task T4.3: Sitemap and Robots.txt

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Generate sitemap.xml with product and category URLs. Create robots.txt: allow product/category pages, block /admin, /cart, /checkout, /account.

**Acceptance criteria:**
- [ ] /sitemap.xml exists and lists URLs
- [ ] /robots.txt exists
- [ ] robots.txt blocks admin, cart, checkout
- [ ] Sitemap submitted to Google Search Console

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | GET /sitemap.xml | Valid XML with URLs | |
| 2 | GET /robots.txt | Disallow /admin, etc. | |
| 3 | Submit to Search Console | Accepted | |

**Files to modify:** Vite config or generate script, public/robots.txt

---

### Task T4.4: Image Optimization

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Compress images, use WebP where possible. Implement lazy loading. Target under 200KB per product image.

**Acceptance criteria:**
- [ ] Images served as WebP when supported
- [ ] Lazy loading on product grids
- [ ] Size reduced where possible

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Check Network tab | Images under 200KB or lazy | |
| 2 | Scroll product list | Images load on scroll | |

**Files to modify:** Image components, build/upload pipeline

---

### Task T4.5: Code Splitting / Lazy Load

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Lazy load admin routes and checkout. Reduce initial bundle. Most users never see admin.

**Acceptance criteria:**
- [ ] Admin routes lazy loaded
- [ ] Checkout lazy loaded
- [ ] Initial bundle smaller

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Load homepage | No admin JS in initial load | |
| 2 | Navigate to /admin | Admin chunk loads | |

**Files to modify:** `src/App.tsx` (React.lazy), route definitions

---

### Task T4.6: WhatsApp Chat Button

**Priority:** Medium  
**Estimated effort:** Small

**Description:**  
Add floating WhatsApp button (important for Pakistan). Link to business number. Optional: pre-fill message.

**Acceptance criteria:**
- [ ] Button visible on all pages
- [ ] Opens WhatsApp with number
- [ ] Mobile-friendly position

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Click WhatsApp button | Opens WhatsApp with correct number | |
| 2 | View on mobile | Button not covering content | |

**Files to modify:** New WhatsAppButton component, layout

---

## Section 5: Business Operations and Legal

### Task T5.1: Return and Refund Policy

**Priority:** Critical  
**Estimated effort:** Medium

**Description:**  
Create clear policy: conditions for returns (damaged, wrong item), timeframe (e.g. 7 days), process, refund method, who pays return shipping.

**Acceptance criteria:**
- [ ] Dedicated page or section
- [ ] Covers conditions, process, refund
- [ ] Link in footer

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Navigate to policy | Page loads, content clear | |

**Files to modify:** New page or extend Terms, Footer

---

### Task T5.2: Contact Us Page

**Priority:** Critical  
**Estimated effort:** Small

**Description:**  
Contact page with: address, phone, WhatsApp, email, business hours. Add to footer on every page.

**Acceptance criteria:**
- [ ] /contact route
- [ ] All contact info present
- [ ] Footer link
- [ ] Optional: contact form

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Navigate to /contact | Info displayed | |
| 2 | Click phone/WhatsApp | Opens correctly | |

**Files to modify:** ContactPage.tsx, App.tsx, Footer

---

### Task T5.3: FAQ Page

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
FAQ covering: delivery time, payment methods, plant care basics, return process, damaged items, warranty.

**Acceptance criteria:**
- [ ] /faq route
- [ ] Accordion or expandable sections
- [ ] Covers common questions

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Open FAQ | Questions and answers visible | |
| 2 | Expand/collapse | Works on mobile | |

**Files to modify:** FAQPage.tsx, App.tsx

---

### Task T5.4: About Us Page

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
About page: story, why you started, what makes you different, quality commitment. Builds trust.

**Acceptance criteria:**
- [ ] /about route
- [ ] Engaging content
- [ ] Link in footer or nav

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Navigate to /about | Page loads | |

**Files to modify:** AboutPage.tsx, App.tsx

---

### Task T5.5: Admin Order Management Improvements

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Admin: bulk status update, print invoice, export CSV, mark shipped with tracking, customer notes.

**Acceptance criteria:**
- [ ] Bulk select and update status
- [ ] Print/PDF invoice
- [ ] CSV export
- [ ] Tracking number field
- [ ] Notes field

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Select 3 orders, update status | All 3 updated | |
| 2 | Export orders | CSV downloads | |
| 3 | Add tracking, save | Saved and visible to customer | |

**Files to modify:** AdminOrdersPage.tsx, backend if needed

---

### Task T5.6: Inventory Alerts

**Priority:** High  
**Estimated effort:** Medium

**Description:**  
Email admin when stock below threshold (e.g. 5). Dashboard widget for low-stock items.

**Acceptance criteria:**
- [ ] Threshold configurable
- [ ] Email sent when low
- [ ] Dashboard shows low-stock list

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Set product stock to 3 | Admin gets email | |
| 2 | Open admin dashboard | Low-stock widget shows item | |

**Files to modify:** Supabase function/trigger, AdminDashboard

---

## Section 6: Testing and Quality Assurance

### Task T6.1: Pre-Launch Testing Checklist

**Priority:** Critical  
**Estimated effort:** Large

**Description:**  
Run through full testing checklist before launch. Document results.

**Acceptance criteria:**
- [ ] All checklist items executed
- [ ] Results recorded
- [ ] Critical issues fixed

**Test cases:**

| # | Area | Steps | Pass/Fail |
|---|------|-------|-----------|
| 1 | Registration | Signup, login, wrong password, reset | |
| 2 | Cart | Add, update, remove, persistence, isolation | |
| 3 | Checkout | Full flow, low stock, confirmation | |
| 4 | Stock | Over-purchase, simultaneous, negative | |
| 5 | Admin | CRUD products, images, orders, RLS | |
| 6 | Browsers | Chrome, Firefox, Safari, Edge | |
| 7 | Mobile | Android, iPhone, iPad | |
| 8 | Performance | 50+ products, slow 3G | |
| 9 | Security | Admin as user, SQL/XSS attempts | |
| 10 | Errors | Network fail, invalid input, missing image | |

**Files to modify:** N/A (testing only)

---

### Task T6.2: Error Tracking (Sentry)

**Priority:** Critical  
**Estimated effort:** Small

**Description:**  
Set up Sentry or similar for real-time error monitoring. Get alerts for critical errors.

**Acceptance criteria:**
- [ ] Sentry integrated
- [ ] Errors captured
- [ ] Alerts configured

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Trigger test error | Appears in Sentry | |
| 2 | Check alert email | Received | |

**Files to modify:** Main entry, Sentry init

---

### Task T6.3: Analytics Setup

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Install Google Analytics 4. Track: page views, add-to-cart, checkout start, purchase, bounce rate, session duration.

**Acceptance criteria:**
- [ ] GA4 installed
- [ ] Events configured
- [ ] Consent respected (Task T2.3)

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Add to cart | Event in GA4 | |
| 2 | Complete purchase | Purchase event | |

**Files to modify:** Layout, analytics module

---

### Task T6.4: Backup Strategy

**Priority:** High  
**Estimated effort:** Small

**Description:**  
Automated daily Supabase backups. Test restore. Keep 30 days.

**Acceptance criteria:**
- [ ] Backups enabled
- [ ] Restore tested
- [ ] Retention 30 days

**Test cases:**

| # | Steps | Expected Result | Pass/Fail |
|---|-------|-----------------|-----------|
| 1 | Run restore in staging | Data restored | |

**Files to modify:** Supabase Dashboard, docs

---

### Task T6.5: Uptime Monitoring

**Priority:** Medium  
**Estimated effort:** Small

**Description:**  
Use UptimeRobot or similar. Monitor homepage and key URLs. SMS/email if down.

**Acceptance criteria:**
- [ ] Monitoring configured
- [ ] Alerts set
- [ ] Test alert works

**Files to modify:** External service config

---

## Section 7: Launch Day Checklist

Complete 24 hours before going live:

| # | Task | Done |
|---|------|------|
| 1 | Database backups completed and tested | |
| 2 | All RLS policies enabled and tested | |
| 3 | Payment gateway in production, test transactions done | |
| 4 | Order confirmation and shipping emails working | |
| 5 | All product info complete (descriptions, images, prices, stock) | |
| 6 | SSL installed, HTTPS enforced | |
| 7 | Google Analytics installed | |
| 8 | Sitemap submitted to Google Search Console | |
| 9 | Privacy Policy and Terms published | |
| 10 | Contact info and support channels active | |
| 11 | Social media created and linked | |
| 12 | WhatsApp Business number set up | |
| 13 | 404 page designed and deployed | |
| 14 | Favicon and app icons added | |
| 15 | Mobile responsiveness verified | |
| 16 | Full test purchase (product → confirmation) | |
| 17 | Team trained on orders and support | |
| 18 | Launch announcement ready | |

---

## Priority Implementation Order

### Week 1 - Critical Security and Payment
- T1.1, T1.2, T1.3 - RLS audit, admin security, file validation
- T1.4, T1.5 - Email verification, password reset
- T3.1 - Payment gateway
- T3.2 - Order emails
- T3.3 - Delivery charges

### Week 2 - Legal and Trust
- T2.1, T2.2 - Privacy, Terms
- T5.1, T5.2 - Return policy, Contact page
- T5.3, T5.4 - FAQ, About Us
- T2.4, T2.5 - Product descriptions, images

### Week 3 - UX and Performance
- T3.6 - Mobile verification
- T3.9, T3.10 - Loading states, error messages
- T3.11 - Breadcrumbs
- T4.1, T4.2 - Meta tags, structured data
- T4.3 - Sitemap, robots.txt
- T4.4, T4.5 - Image optimization, code splitting

### Week 4 - Testing and Launch
- T6.1 - Full testing checklist
- T6.2, T6.3 - Error tracking, analytics
- T6.4, T6.5 - Backups, uptime
- Section 7 - Launch day checklist

---

## Quick Reference: Task Index

| ID | Task | Priority |
|----|------|----------|
| T1.1 | Audit RLS policies | Critical |
| T1.2 | Secure admin routes | Critical |
| T1.3 | Validate file uploads | Critical |
| T1.4 | Email verification | High |
| T1.5 | Password reset flow | High |
| T1.6 | Rate limiting | Medium |
| T2.1 | Privacy Policy | Critical |
| T2.2 | Terms and Conditions | Critical |
| T2.3 | Cookie consent | High |
| T2.4 | Product descriptions | Critical |
| T2.5 | Product images + alt | Critical |
| T2.6 | Price parsing fix | High |
| T2.7 | Extend categories | High |
| T2.8 | Search filters | Medium |
| T3.1 | Payment gateway | Critical |
| T3.2 | Order emails | Critical |
| T3.3 | Delivery charges | Critical |
| T3.4 | Order tracking | High |
| T3.5 | Minimum order | High |
| T3.6 | Verify mobile | High |
| T3.7 | Guest checkout | High |
| T3.8 | Address validation | Medium |
| T3.9 | Loading states | High |
| T3.10 | Error messages | Medium |
| T3.11 | Breadcrumbs | Medium |
| T4.1 | Meta tags | Critical |
| T4.2 | Structured data | High |
| T4.3 | Sitemap, robots | High |
| T4.4 | Image optimization | High |
| T4.5 | Code splitting | High |
| T4.6 | WhatsApp button | Medium |
| T5.1 | Return policy | Critical |
| T5.2 | Contact page | Critical |
| T5.3 | FAQ | High |
| T5.4 | About Us | High |
| T5.5 | Admin order management | High |
| T5.6 | Inventory alerts | High |
| T6.1 | Testing checklist | Critical |
| T6.2 | Error tracking | Critical |
| T6.3 | Analytics | High |
| T6.4 | Backups | High |
| T6.5 | Uptime monitoring | Medium |
