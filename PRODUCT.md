# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary audience of the public landing page: SIH 2026 judges and Bharat Electronics Limited (BEL) officials deciding whether BELTAL is credible and deployable inside BEL. Secondary: BEL integrators evaluating the API (public `/docs`). In-app users are ADMIN, MANAGER, AUDITOR, USER and machine-only SYSTEM_CONNECTOR.

## Product Purpose
BELTAL (Blockchain-Enabled Trusted Access & Asset Ledger, SIH 2026 PS 26125) is a blockchain-backed layer under BEL's existing systems for decentralized identity (DIDs), role-based access control, and soulbound custody tokens for assets. Every identity change, access grant and asset transfer gets a permanent, independently verifiable record. Success: evaluators understand the mechanism and trust it is real.

## Positioning
Chain is the source of truth; a Postgres cache is diffed against it by an anti-tamper verifier, so records can be independently verified. PII is AES-256-GCM encrypted on IPFS, only DID and salted hash on-chain.

## Operating Context
Wallet sign-in (nonce + signature, JWT), admin-approved self-registration, PACS badge integration, Sepolia testnet demo.

## Capabilities and Constraints
Plain JavaScript only (no TypeScript). React 19 + Vite + Tailwind 4 frontend; app is light-only by product decision. Asset tokens are custom soulbound, not ERC-721. Do not invent telemetry: block numbers must be real or show "Chain unreachable".

## Brand Commitments
Name BELTAL. Government-of-India / Ministry of Defence context, BEL as the sponsor.

## Evidence on Hand
Working app, Sepolia deployment, `/docs` API reference, demo seed. Absent and not to be fabricated: ISO 27001 certification, partner/customer endorsements (DRDO, NIC, MeitY), benchmarks. User confirmed these unverifiable claims should be removed.

## Product Principles
- Never claim what the code does not do.
- Verifiability is the product; show proof, not assurances.
- Server decides roles; UI only reflects them.
- Plain, legible, official-register communication.

## Accessibility & Inclusion
Public-sector site: aim for GIGW / WCAG 2.1 AA, keyboard operable, readable at small sizes.
