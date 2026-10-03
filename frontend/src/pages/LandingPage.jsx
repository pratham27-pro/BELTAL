import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginModal from '../components/auth/LoginModal'
import { useAuth } from '../context/AuthContext'
import useBlockNumber from '../hooks/useBlockNumber'
import { CONTRACT_ADDRESSES, SEPOLIA_CONFIG } from '../config/contracts'

/**
 * LandingPage — public front door, laid out like an Indian Government portal
 * (GIGW conventions): tricolour strip, utility bar with skip link and text
 * size, bilingual organisation header, nav band, notices, plain tables.
 *
 * Nothing here is invented telemetry: the block number is the live Sepolia
 * head and the contract addresses come from the deployed artifacts.
 */

const INK = 'text-gov-ink'
const LINK = 'text-gov-link underline underline-offset-2 hover:text-gov-link-hover'
const FOCUS =
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-gov-focus'
const BTN_PRIMARY = `inline-flex items-center justify-center gap-2 bg-gov-saffron px-5 py-2.5 text-[0.9375rem] font-semibold text-gov-navy-deep hover:bg-gov-saffron-hover ${FOCUS}`
const BTN_GHOST = `inline-flex items-center justify-center gap-2 border border-white bg-transparent px-5 py-2.5 text-[0.9375rem] font-semibold text-white hover:bg-white/10 ${FOCUS}`

const NAV = [
  ['Home', '#main'],
  ['About', '#about'],
  ['Services', '#services'],
  ['Process', '#process'],
  ['Portals', '#portals'],
  ['Problem Statement', '#problem'],
]

const SERVICES = [
  {
    name: 'Decentralized identity',
    what: 'Each person receives a DID (did:beltal:<employee code>) tied to a wallet. Only the DID and a salted hash go on-chain; the personal dossier is AES-256-GCM encrypted and pinned to IPFS.',
    who: 'Admin registers; every role views its own',
  },
  {
    name: 'Asset custody tokens',
    what: 'Equipment, licences and credentials are minted as unique, non-duplicable soulbound tokens. Custody changes only through request, approval and execution.',
    who: 'Admin and Manager mint; User requests transfer',
  },
  {
    name: 'Role-based access control',
    what: 'Roles, clearance level (1 to 4) and SBU gating are enforced inside the smart contracts, and again by the API on every route.',
    who: 'Admin assigns roles and clearance',
  },
  {
    name: 'Audit trail and verification',
    what: 'Every identity, access and ownership event is indexed from the chain. An anti-tamper verifier compares the database cache against the chain and reports any difference.',
    who: 'Auditor and Admin',
  },
  {
    name: 'Physical access integration',
    what: 'Badge taps from the plant access-control system are checked against on-chain zone rules. Emergency lockdown is available to administrators.',
    who: 'Admin, Manager; machine connector for ingest',
  },
  {
    name: 'Account recovery',
    what: 'A lost wallet is re-linked through guardian approval. The same DID is re-registered against the new wallet and the old wallet is revoked on-chain.',
    who: 'Guardians approve; Admin executes',
  },
]

const PROCESS = [
  ['Sign in with wallet', 'The wallet signs a one-time nonce. The server issues a session and decides the role; the client never supplies one.'],
  ['Register and approve', 'A new wallet submits name, employee ID and SBU. It has no access until an Admin approves it and chooses role and clearance.'],
  ['Record on the ledger', 'Approval registers the identity and role on-chain. Asset minting and custody transfers follow the same chain-first rule.'],
  ['Verify independently', 'Any auditor can check a transaction or a record against the chain, without trusting the application database.'],
]

const PORTALS = [
  ['Administrator', 'Approve registrations, assign roles and clearance, mint assets, quarantine identities, manage zones and recovery, full audit access.'],
  ['Manager', 'View the team and its assets, initiate and approve transfers within the SBU, issue cross-SBU access passes.'],
  ['Auditor', 'Read-only access to the complete audit trail; verify any record against the chain; query the audit assistant.'],
  ['Employee', 'View own identity and assets, request a custody transfer.'],
]

const PROBLEMS = [
  [
    'Centralized identity databases are single points of failure',
    'Identity is anchored to a wallet and a DID. Personal data is encrypted off-chain; the chain holds only a hash.',
  ],
  [
    'Asset movements are hard to audit across separate registers',
    'Each asset is a single token whose every custody change is an on-chain event, indexed for search and checked by the verifier.',
  ],
  [
    'Manual, paper-bound approvals slow authorization',
    'Approval rules are contract logic with separation of duties: a requester can never approve their own transfer.',
  ],
]

const short = (a) => (a ? `${a.slice(0, 8)}…${a.slice(-6)}` : '')

function SkipAndUtility({ size, setSize }) {
  return (
    <div className="bg-gov-wash-strong border-b border-gov-rule text-[0.8125rem]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1.5">
        <p className={INK}>
          <span lang="hi" className="font-semibold">भारत सरकार</span>
          <span className="mx-2 text-gov-faint" aria-hidden="true">|</span>
          Government of India
        </p>
        <div className="flex items-center gap-4">
          <a href="#main" className={`${LINK} ${FOCUS}`}>Skip to main content</a>
          <div role="group" aria-label="Text size" className="flex items-center gap-1">
            {[['A-', 'Decrease text size', 15], ['A', 'Default text size', 16], ['A+', 'Increase text size', 18]].map(
              ([label, name, px]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={name}
                  aria-pressed={size === px}
                  onClick={() => setSize(px)}
                  className={`min-w-8 border border-gov-rule-strong px-1.5 py-0.5 font-semibold ${
                    size === px ? 'bg-gov-navy text-white' : 'bg-white text-gov-navy hover:bg-gov-hover-strong'
                  } ${FOCUS}`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OrgHeader({ onSignIn }) {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const dashboard =
    { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', AUDITOR: '/auditor/dashboard' }[user?.role] ||
    '/user/dashboard'

  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className={`flex items-center gap-4 ${FOCUS}`} aria-label="BELTAL home">
          <img src="/bel-shield.svg" alt="" className="h-16 w-auto" />
          <div>
            <p lang="hi" className="text-[1.125rem] font-bold leading-snug text-gov-navy">
              भारत इलेक्ट्रॉनिक्स लिमिटेड
            </p>
            <p className="text-[1.25rem] font-bold leading-snug text-gov-navy">Bharat Electronics Limited</p>
            <p className="text-[0.8125rem] text-gov-muted">
              A Government of India Enterprise · Ministry of Defence
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-5">
          <div className="text-right leading-tight">
            <p className="text-[1.5rem] font-bold tracking-wide text-gov-navy">BELTAL</p>
            <p className="text-[0.8125rem] text-gov-muted">Trusted Access &amp; Asset Ledger</p>
          </div>
          {isAuthenticated ? (
            <button type="button" onClick={() => navigate(dashboard)} className={BTN_PRIMARY}>
              My dashboard
            </button>
          ) : (
            <button type="button" onClick={onSignIn} className={BTN_PRIMARY}>
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function NavBand() {
  const [open, setOpen] = useState(false)
  const item = `block px-4 py-3 text-[0.9375rem] font-medium text-white hover:bg-gov-navy-hover ${FOCUS}`
  return (
    <nav aria-label="Primary" className="bg-gov-navy border-b-[3px] border-gov-saffron">
      <div className="mx-auto max-w-[1180px] px-4">
        <button
          type="button"
          className={`md:hidden py-3 text-[0.9375rem] font-semibold text-white ${FOCUS}`}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close menu' : 'Menu'}
        </button>
        <ul id="primary-nav" className={`${open ? 'block' : 'hidden'} md:flex md:items-stretch`}>
          {NAV.map(([label, href]) => (
            <li key={label}>
              <a href={href} className={item} onClick={() => setOpen(false)}>{label}</a>
            </li>
          ))}
          <li>
            <Link to="/docs" className={item}>API Documentation</Link>
          </li>
          <li>
            <Link to="/contact" className={item}>Contact</Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

function Notices() {
  return (
    <section aria-label="Notices" className="border-b border-gov-rule bg-gov-notice">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline gap-x-5 gap-y-1 px-4 py-2 text-[0.9375rem]">
        <span className="bg-gov-navy px-2 py-0.5 text-[0.8125rem] font-bold uppercase tracking-wide text-white">
          Notice
        </span>
        <p className={INK}>
          This is a prototype for Smart India Hackathon 2026 (PS 26125). It runs on the Ethereum Sepolia test
          network; no production BEL data is held.
        </p>
        <Link to="/docs" className={`${LINK} ${FOCUS}`}>Read the API reference</Link>
      </div>
    </section>
  )
}

function LedgerStatus() {
  const block = useBlockNumber()
  const rows = Object.entries(CONTRACT_ADDRESSES)
  return (
    <section aria-labelledby="ledger-status" className="min-w-0 self-start border border-gov-rule-strong bg-white text-gov-ink">
      <h2 id="ledger-status" className="bg-gov-navy px-4 py-2.5 text-[1rem] font-bold text-white">
        Ledger status
      </h2>
      <dl className="divide-y divide-gov-hairline text-[0.9375rem]">
        <div className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-gov-muted">Network</dt>
          <dd className="font-semibold">{SEPOLIA_CONFIG.name} (test network)</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-gov-muted">Latest block</dt>
          <dd className="font-bold tabular-nums" aria-live="polite">
            <span
              key={block ?? 'none'}
              className={`${block == null ? 'text-gov-muted' : 'gov-tick text-[1.5rem] text-gov-green'} px-1.5`}
            >
              {block == null ? 'Chain unreachable' : block.toLocaleString('en-IN')}
            </span>
            {block != null && <span className="ml-1 text-[0.8125rem] font-semibold text-gov-green">Live</span>}
          </dd>
        </div>
      </dl>
      <table className="w-full border-t border-gov-hairline text-left text-[0.9375rem]">
        <caption className="sr-only">Deployed contracts</caption>
        <thead className="bg-gov-wash-strong text-gov-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold">Contract</th>
            <th scope="col" className="px-4 py-2 font-semibold">Address</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gov-hairline">
          {rows.map(([name, addr]) => (
            <tr key={name}>
              <th scope="row" className="px-4 py-2 font-medium">{name}</th>
              <td className="px-4 py-2">
                <a
                  href={`${SEPOLIA_CONFIG.explorerUrl}/address/${addr}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${LINK} ${FOCUS} tabular-nums`}
                  title={addr}
                >
                  {short(addr)}
                  <span className="sr-only"> (opens Etherscan in a new tab)</span>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-gov-hairline px-4 py-2 text-[0.8125rem] text-gov-muted">
        Read directly from the chain. Any record can be checked against these contracts.
      </p>
    </section>
  )
}

function SectionHeading({ id, children }) {
  return (
    <h2 id={id} className="border-b-2 border-gov-navy pb-2 text-[1.5rem] font-bold text-gov-navy">
      {children}
    </h2>
  )
}

export default function LandingPage({ autoOpenLogin = false }) {
  const [loginOpen, setLoginOpen] = useState(autoOpenLogin)
  const [size, setSize] = useState(16)

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.fontSize
    root.style.fontSize = `${size}px`
    return () => { root.style.fontSize = previous }
  }, [size])

  return (
    <div
      className={`gov-landing min-h-screen bg-white ${INK} antialiased selection:bg-gov-select`}
    >
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />

      <div aria-hidden="true" className="flex h-1.5">
        <span className="flex-1 bg-gov-saffron" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-gov-green" />
      </div>
      <SkipAndUtility size={size} setSize={setSize} />
      <OrgHeader onSignIn={() => setLoginOpen(true)} />
      <NavBand />
      <Notices />

      <main id="main" tabIndex={-1}>
        {/* Hero */}
        <section aria-labelledby="hero-title" className="border-b-[3px] border-gov-saffron bg-gov-navy text-white">
          <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-16 lg:grid-cols-[1.25fr_1fr]">
            <div className="min-w-0 gov-rise">
              <h1 id="hero-title" className="max-w-[20ch] text-balance text-[2.5rem] font-bold leading-[1.1] text-white sm:text-[3.5rem]">
                Blockchain-Enabled Trusted Access &amp; Asset Ledger
              </h1>
              <p className="mt-6 max-w-[60ch] text-[1.1875rem] leading-relaxed text-gov-on-navy">
                BELTAL is a ledger layer that sits beneath Bharat Electronics Limited's existing systems. It gives
                every identity change, access grant and asset transfer a permanent record that anyone with the
                right role can verify independently, so no single database holds the only copy of the truth.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => setLoginOpen(true)} className={BTN_PRIMARY}>
                  Sign in with wallet
                </button>
                <Link to="/register" className={BTN_GHOST}>Request registration</Link>
                <Link to="/docs" className={BTN_GHOST}>API documentation</Link>
              </div>
              <p className="mt-4 max-w-[65ch] text-[0.9375rem] text-gov-on-navy">
                New wallets have no access until an administrator approves the registration.
              </p>
            </div>
            <LedgerStatus />
          </div>
        </section>

        {/* About */}
        <section id="about" aria-labelledby="about-h" className="mx-auto max-w-[1180px] px-4 py-14">
          <SectionHeading id="about-h">About BELTAL</SectionHeading>
          <div className="mt-5 grid gap-x-12 gap-y-4 md:grid-cols-[1.3fr_1fr]">
            <p className="max-w-[60ch] text-[1.1875rem] leading-relaxed">
              The chain is the source of truth for identity, access and asset state. The application keeps a
              database copy only so that dashboards load quickly; every write still goes through a smart
              contract, and a verifier compares the copy against the chain.
            </p>
            <p className="max-w-[48ch] leading-relaxed text-gov-muted">
              Asset tokens are custody records, not tradable tokens. They cannot be duplicated and move only
              through a controlled request, approval and execution flow, with separation of duties enforced.
            </p>
          </div>
        </section>

        {/* Services */}
        <section id="services" aria-labelledby="services-h" className="border-y border-gov-rule bg-gov-wash py-14">
          <div className="mx-auto max-w-[1180px] px-4">
            <SectionHeading id="services-h">Services</SectionHeading>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] border border-gov-rule-strong bg-white text-left text-[0.9375rem]">
                <caption className="sr-only">Services provided by BELTAL</caption>
                <thead className="bg-gov-navy text-white">
                  <tr>
                    <th scope="col" className="w-[22%] px-4 py-2.5 font-semibold">Service</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Description</th>
                    <th scope="col" className="w-[24%] px-4 py-2.5 font-semibold">Used by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gov-rule">
                  {SERVICES.map((s) => (
                    <tr key={s.name}>
                      <th scope="row" className="px-4 py-3 align-top font-semibold text-gov-navy">{s.name}</th>
                      <td className="max-w-[60ch] px-4 py-3 align-top leading-relaxed">{s.what}</td>
                      <td className="px-4 py-3 align-top text-gov-muted">{s.who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Process and portals */}
        <div className="mx-auto grid max-w-[1180px] gap-x-14 gap-y-14 px-4 py-14 lg:grid-cols-2">
          <section id="process" aria-labelledby="process-h">
            <SectionHeading id="process-h">How a record is made</SectionHeading>
            <ol className="mt-5 space-y-5">
              {PROCESS.map(([title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-gov-navy font-bold text-gov-navy"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-gov-navy">{title}</h3>
                    <p className="mt-1 max-w-[56ch] leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="portals" aria-labelledby="portals-h">
            <SectionHeading id="portals-h">Portals by role</SectionHeading>
            <dl className="mt-5 divide-y divide-gov-rule border-y border-gov-rule">
              {PORTALS.map(([role, text]) => (
                <div key={role} className="py-3">
                  <dt className="font-bold text-gov-navy">{role}</dt>
                  <dd className="mt-1 max-w-[56ch] leading-relaxed">{text}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.9375rem] text-gov-muted">
              The server decides each person's role after sign-in. A role chosen on the sign-in screen is a
              preference only.
            </p>
          </section>
        </div>

        {/* Problem statement */}
        <section id="problem" aria-labelledby="problem-h" className="mx-auto max-w-[1180px] px-4 pb-16 pt-2">
          <SectionHeading id="problem-h">Problem statement: SIH 2026, PS 26125</SectionHeading>
          <p className="mt-5 max-w-[65ch] leading-relaxed">
            Bharat Electronics Limited asked for a blockchain-based layer for decentralized identity,
            access control and digital asset ownership. How BELTAL responds:
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border border-gov-rule-strong text-left text-[0.9375rem]">
              <caption className="sr-only">Problems and how BELTAL addresses them</caption>
              <thead className="bg-gov-wash-strong text-gov-navy">
                <tr>
                  <th scope="col" className="w-1/2 px-4 py-2.5 font-semibold">Problem</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">How BELTAL addresses it</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gov-rule">
                {PROBLEMS.map(([p, s]) => (
                  <tr key={p}>
                    <td className="px-4 py-3 align-top font-medium">{p}</td>
                    <td className="px-4 py-3 align-top leading-relaxed">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="border-t-[3px] border-gov-saffron bg-gov-navy text-[0.9375rem] text-gov-on-navy">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-[1rem] font-bold text-white">Bharat Electronics Limited</p>
            <p className="mt-1">A Government of India Enterprise, Ministry of Defence</p>
            <p className="mt-4 max-w-[48ch] leading-relaxed">
              BELTAL is a Smart India Hackathon 2026 prototype. It demonstrates the design on a public test
              network and is not a production BEL system.
            </p>
          </div>
          <div>
            <h2 className="font-bold text-white">On this site</h2>
            <ul className="mt-3 space-y-2">
              <li><a className={`underline ${FOCUS}`} href="#about">About</a></li>
              <li><a className={`underline ${FOCUS}`} href="#services">Services</a></li>
              <li><a className={`underline ${FOCUS}`} href="#portals">Portals by role</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-white">Resources</h2>
            <ul className="mt-3 space-y-2">
              <li><Link className={`underline ${FOCUS}`} to="/docs">API documentation</Link></li>
              <li><Link className={`underline ${FOCUS}`} to="/register">Request registration</Link></li>
              <li><Link className={`underline ${FOCUS}`} to="/contact">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/15 px-4 py-4 text-center text-[0.8125rem]">
          © 2026 Bharat Electronics Limited
        </div>
      </footer>
    </div>
  )
}
