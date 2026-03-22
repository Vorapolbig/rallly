# Implementation Checklist

## Phase 1: Setup
- [x] Branch created: feat/cloudflare-access-simplified
- [x] Docs directory created

## Phase 2: Remove Better-Auth
- [ ] Remove better-auth API route handler
- [ ] Remove login page
- [ ] Remove register page
- [ ] Remove forgot-password/reset-password pages
- [ ] Remove auth utilities directory
- [ ] Find & fix better-auth imports
- [ ] Remove better-auth from package.json
- [ ] Fix remaining TypeScript errors
- [ ] Remove auth env vars

## Phase 3: CF Access Integration
- [ ] Create CF Access user helper (cf-access.ts + tests)
- [ ] Create admin user helper in data.ts
- [ ] Update tRPC context
- [ ] Update tRPC procedure definitions
- [ ] Update tRPC route handler
- [ ] Update root layout
- [ ] Add local dev mocking

## Phase 4: Remove Spaces
- [ ] Remove spaces tRPC router
- [ ] Remove space components
- [ ] Remove space navigation
- [ ] Remove space settings pages
- [ ] Remove space sidebar links
- [ ] Remove space permissions/CASL
- [ ] Update poll model (spaceId optional)
- [ ] Remove space context/middleware
- [ ] Fix type errors
- [ ] Delete space feature directory

## Phase 5: Remove Billing
- [ ] Remove Stripe API routes
- [ ] Remove billing tRPC router
- [ ] Remove billing settings page
- [ ] Remove billing components
- [ ] Remove proProcedure/spaceOwnerProcedure
- [ ] Remove Stripe from package.json
- [ ] Remove billing env vars

## Phase 6: Remove Email
- [ ] Remove email sending from mutations
- [ ] Remove email env vars
- [ ] Remove email notification preferences
- [ ] Remove email templates usage

## Phase 7: Simplify Polls
- [ ] Remove "If Need Be" vote option
- [ ] Remove poll duplication
- [ ] Remove anonymous voting
- [ ] Simplify poll lifecycle

## Phase 8: Database Migration
- [ ] Remove Space/SpaceMember tables from schema
- [ ] Remove Subscription/billing tables
- [ ] Remove Account/Session/VerificationToken tables
- [ ] Simplify User model
- [ ] Run migration

## Phase 9: UI Cleanup
- [ ] Remove space switcher from nav
- [ ] Simplify settings tabs
- [ ] Add CF Access sign-out
- [ ] Remove upgrade/billing UI

## Phase 10: Testing
- [ ] pnpm type-check passes
- [ ] pnpm test:unit passes
- [ ] Manual browser test passes
