'use strict';
const $ = (selector) => document.querySelector(selector);
const layers = {
  browser: [
    'Your device',
    'Browser: interaction and presentation',
    'React displays orders and forms, keeps temporary selection state and sends HTTPS requests to the same application API. A selected product is only a draft until the server accepts it. Database passwords never travel to the browser.',
    'src/components/return-form.tsx · demo-context.tsx',
  ],
  next: [
    'Vercel Functions',
    'Next.js: the HTTP entry point',
    'The browser calls a /api URL. A route.ts module exports POST or GET and executes on Node.js in Vercel. The route passes the request to an application handler; it does not contain the entire domain implementation. Server and browser code share a repository, not the same execution environment.',
    'src/app/api/customers/[customerId]/orders/[orderId]/returns/route.ts',
  ],
  domain: [
    'Trusted server modules',
    'Validate, enforce rules, then persist',
    'Zod checks the input shape. The environment capability, origin and write limits are checked. Domain services evaluate order eligibility, quantities and legal transitions inside a transaction. Prisma and pg translate application data operations into PostgreSQL queries.',
    'src/features/returns/handlers.ts · create.ts · src/lib/prisma.ts',
  ],
  neon: [
    'Durable storage',
    'Neon: the managed PostgreSQL service',
    'Neon hosts the database independently of a running Vercel Function. It stores products, visitor environments, customers, orders, return items, decisions and history. PostgreSQL enforces constraints and transactions; data survives a page reload or the end of a Function invocation.',
    'prisma/schema.prisma · prisma/migrations/ · src/lib/prisma.ts',
  ],
};
for (const button of document.querySelectorAll('[data-layer]'))
  button.addEventListener('click', () => {
    for (const other of document.querySelectorAll('[data-layer]')) {
      const active = other === button;
      other.classList.toggle('active', active);
      other.setAttribute('aria-pressed', String(active));
    }
    const [kicker, title, body, code] = layers[button.dataset.layer];
    $('#layer-kicker').textContent = kicker;
    $('#layer-title').textContent = title;
    $('#layer-description').textContent = body;
    $('#layer-code').textContent = code;
  });
const requestSteps = [
  [
    'Choose products',
    'Browser · React',
    'The customer selects units and a reason. The interface can disable obviously invalid quantities and show a review screen. This is draft state; no return is saved yet.',
    'Draft: order + selected item IDs + positive quantities + reason',
    'Client validation improves feedback. It cannot replace server checks.',
  ],
  [
    'Send the request',
    'Browser → Next.js API',
    'The Create request action sends JSON to the same-origin API, with cookies, an idempotency key and the current demo generation. The response is still pending: the UI must not invent a successful outcome.',
    'POST /api/customers/{customerId}/orders/{orderId}/returns\nIdempotency-Key: one action identifier\nX-Demo-Generation: current generation',
    'The browser calls the application, not Neon. There are no database credentials in the payload.',
  ],
  [
    'Resolve the environment',
    'Next.js · server',
    'The server checks the origin and anonymous limits, validates the visitor cookie, resolves the demo token hash and checks ownership, expiry and generation. The customer/order IDs must belong to this scoped environment.',
    'visitorFrom → session → withEnvironment\nEnvironment lock + current server time',
    'Switching to Administrator is a demo view choice, not authenticated business-role authorization.',
  ],
  [
    'Validate the domain',
    'Domain services · Zod',
    'Input must contain valid IDs, a reason and positive integer quantities from a single existing order. The order must be delivered and within the configured calendar-day window. Available quantity subtracts pending, approved and received units.',
    'available = purchased − committed\ncommitted states = PENDING + APPROVED + RECEIVED',
    'A request can include the same order item again only while units remain available.',
  ],
  [
    'Commit atomically',
    'Prisma + pg → Neon',
    'Within the transaction, create the pending request, return lines, creation history and operation receipt. Database constraints and the locked environment prevent partial writes and competing over-reservations. A failure rolls back the transaction.',
    'BEGIN → validate → request + items + history + receipt → COMMIT\nFailure → ROLLBACK',
    'Prisma is a library in the server. PostgreSQL in Neon owns the durable transaction.',
  ],
  [
    'Return safe data',
    'Next.js API → Browser',
    'A successful response supplies the saved request and current context. Invalid input, missing resources or conflicts return the project’s safe error envelope. Technical logs must not reveal credentials, SQL or raw visitor tokens.',
    'Success → saved request\n400 invalid input · 404 missing · 409 conflict\n500 unexpected failure',
    'A retry with the same action key and payload reuses the successful operation receipt instead of adding duplicate history.',
  ],
  [
    'Render and follow up',
    'Browser · React',
    'The customer sees Pending review and can inspect the history. Another tab can approve in the administrator view. Refresh loads that decision for the customer; there is no realtime WebSocket subscription in this implementation.',
    'Pending → approved → received\nCustomer refresh → latest status + ordered events',
    'The backend revalidates every action. Previously displayed eligibility is not a reservation guarantee.',
  ],
];
let step = 0;
requestSteps.forEach((entry, index) => {
  const li = document.createElement('li'),
    button = document.createElement('button'),
    number = document.createElement('span'),
    label = document.createElement('span');
  number.className = 'step-count';
  number.textContent = String(index + 1);
  label.textContent = entry[0];
  button.append(number, label);
  button.addEventListener('click', () => showStep(index));
  li.append(button);
  $('#request-steps').append(li);
});
function showStep(index) {
  step = index;
  document.querySelectorAll('#request-steps button').forEach((b, i) => {
    b.classList.toggle('active', i === index);
    b.setAttribute('aria-pressed', String(i === index));
  });
  const [title, place, body, code, tip] = requestSteps[index];
  $('#request-title').textContent = title;
  $('#request-place').textContent = place;
  $('#request-body').textContent = body;
  $('#request-code').textContent = code;
  $('#request-tip').textContent = tip;
  $('#request-progress').textContent = `Step ${index + 1} of ${requestSteps.length}`;
  $('#request-prev').disabled = index === 0;
  $('#request-next').disabled = index === requestSteps.length - 1;
}
$('#request-prev').addEventListener('click', () => showStep(Math.max(0, step - 1)));
$('#request-next').addEventListener('click', () =>
  showStep(Math.min(requestSteps.length - 1, step + 1)),
);
showStep(0);
const labels = {
  PENDING: 'Pending review',
  APPROVED: 'Approved — awaiting pickup',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  RECEIVED: 'Return received',
};
let state = null;
const rules = {
  create: {
    from: null,
    to: 'PENDING',
    actor: 'Customer',
    event: 'Created',
    text: 'One unit is reserved. The other purchased unit is still available. The customer can cancel while this request is pending.',
  },
  approve: {
    from: 'PENDING',
    to: 'APPROVED',
    actor: 'Administrator',
    event: 'Approved',
    text: 'The unit stays committed. Pickup is simulated; approval does not issue a refund or confirm physical receipt.',
  },
  reject: {
    from: 'PENDING',
    to: 'REJECTED',
    actor: 'Administrator',
    event: 'Rejected',
    text: 'The unit is released. Rejection reason: “The request does not meet the demonstration policy.” A real application action requires a nonblank reason.',
  },
  cancel: {
    from: 'PENDING',
    to: 'CANCELLED',
    actor: 'Customer',
    event: 'Cancelled',
    text: 'The unit is released. The application asks for confirmation before cancellation. A cancelled request cannot be reactivated.',
  },
  receive: {
    from: 'APPROVED',
    to: 'RECEIVED',
    actor: 'Administrator',
    event: 'Received',
    text: 'The return is final. Its unit remains committed; receipt does not free it for another return or issue a refund.',
  },
};
function renderLifecycle() {
  const committed = ['PENDING', 'APPROVED', 'RECEIVED'].includes(state) ? 1 : 0;
  $('#committed').textContent = String(committed);
  $('#available').textContent = String(2 - committed);
  $('#life-state').textContent = labels[state] || 'Not submitted';
  document.querySelectorAll('[data-state]').forEach((n) => {
    const active = n.dataset.state === state;
    n.classList.toggle('active', active);
    if (active) n.setAttribute('aria-current', 'step');
    else n.removeAttribute('aria-current');
  });
  for (const [action, rule] of Object.entries(rules))
    $(`#life-${action}`).disabled = state !== rule.from;
}
for (const [action, rule] of Object.entries(rules))
  $(`#life-${action}`).addEventListener('click', () => {
    if (state !== rule.from) return;
    state = rule.to;
    $('#life-message').textContent = rule.text;
    const event = document.createElement('li');
    event.textContent = `${rule.event} · ${rule.actor} · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    $('#event-log').append(event);
    renderLifecycle();
  });
$('#life-reset').addEventListener('click', () => {
  state = null;
  $('#event-log').replaceChildren();
  $('#life-message').textContent =
    'Example restarted. This resets only the local teaching model, not an application environment.';
  renderLifecycle();
});
renderLifecycle();
const tech = {
  React: [
    'User interface',
    'Interactive components',
    'React controls the customer/admin experience and responds to selection, forms, loading and server results.',
    [
      'Local drafts and screen state are not persisted returns.',
      'The demo data hook reuses loaded pages and keeps content visible during refresh.',
      'Other-tab decisions become visible when refreshed.',
    ],
    'src/components/ · src/components/demo-context.tsx',
  ],
  'Next.js': [
    'Fullstack framework',
    'Pages and backend routes together',
    'App Router defines pages/layouts and server-side HTTP endpoints in one project. Route Handlers execute on the server, with Node.js explicitly selected for these APIs.',
    [
      'The browser sends requests to /api on the same application origin.',
      'HTTP adapters call modules under src/features/.',
      'One deployment simplifies this MVP; domain modules remain separate from UI.',
    ],
    'src/app/ · src/app/api/',
  ],
  'Node.js': [
    'Server runtime',
    'Runs the backend JavaScript',
    'Node.js executes the Next.js API code in Vercel Functions. It can use server environment variables and the pg database driver.',
    [
      'Production is constrained to Node 22.x, minimum 22.12.',
      'Function instances can finish or be recycled; durable data belongs in PostgreSQL.',
      'Secrets are read on the server, not injected into browser components.',
    ],
    'package.json · .nvmrc · src/lib/env.ts',
  ],
  Vercel: [
    'Application hosting',
    'Builds and serves the application',
    'Vercel builds the GitHub project, serves the web application and runs its server Functions. Neon remains a separate database service.',
    [
      'The public application has an HTTPS domain.',
      'Production secrets are configured per environment.',
      'vercel.json declares the region and protected cleanup schedule.',
    ],
    'vercel.json · docs/deployment.md',
  ],
  Neon: [
    'Managed database service',
    'Hosts our PostgreSQL database',
    'The application connects to Neon to persist its catalog, scoped environments, requests and history. This project uses its PostgreSQL service, not Neon-hosted authentication or Functions.',
    [
      'Runtime DATABASE_URL uses the pooled endpoint.',
      'Controlled migrations use DATABASE_URL_UNPOOLED.',
      'Production data and local/CI test data are separate.',
    ],
    'src/lib/prisma.ts · prisma.config.ts · docs/deployment.md',
  ],
  PostgreSQL: [
    'Database engine',
    'Keeps relational data consistent',
    'Tables, foreign keys, checks and transactions store and protect the application data. A shared environment transaction lock serializes competing operations for that environment.',
    [
      'Requests, items and history commit together.',
      'Environment/generation scoping supports visitor isolation.',
      'Production currently reports 18.6; local/CI coverage uses 17.',
    ],
    'prisma/schema.prisma · prisma/migrations/',
  ],
  Prisma: [
    'Data-access library',
    'Typed queries and migrations',
    'Prisma provides the generated typed client used by services. The PostgreSQL adapter and pg pool carry queries over the database connection.',
    [
      'It is not the database or the hosting platform.',
      'Migrations version the schema; they are controlled release steps.',
      'Build generates the client but does not migrate or seed production automatically.',
    ],
    'src/lib/prisma.ts · prisma.config.ts · prisma/migrations/',
  ],
  Zod: [
    'Input validation',
    'Checks the request shape',
    'Zod schemas describe acceptable IDs, quantities, reasons and request bodies. The server parses incoming data before trusting it.',
    [
      'Positive integers and nonempty reasons are input constraints.',
      'Eligibility, available units and transitions also need domain validation.',
      'Client validation helps usability but cannot secure a server write.',
    ],
    'src/features/returns/schemas.ts · src/lib/request-validation.ts',
  ],
  TypeScript: [
    'Development tooling',
    'Makes contracts explicit',
    'TypeScript checks shapes and usage while developing and building. Types do not automatically validate arbitrary JSON received at runtime.',
    [
      'Strict mode improves cross-module contracts.',
      'Zod remains necessary for untrusted input.',
      'The browser and server can share safe types without sharing secrets.',
    ],
    'tsconfig.json · src/lib/contracts.ts',
  ],
  Tailwind: [
    'Presentation tooling',
    'Supports the visual interface',
    'Tailwind/PostCSS and the project’s CSS produce the Clarity interface. Semantic tokens and shared components keep spacing, status colors and light/dark appearance consistent.',
    [
      'Color never replaces readable state labels.',
      'Loading skeletons reserve the shape of content.',
      'Customer/admin presentation can share semantics without sharing actions.',
    ],
    'src/app/globals.css · postcss.config.mjs',
  ],
  Tests: [
    'Verification',
    'Different checks prove different layers',
    'Vitest covers pure rules and database/HTTP behavior; Playwright drives browser journeys and accessibility scenarios. A passing build alone does not prove these flows.',
    [
      'Concurrency and quantities need real database checks.',
      'Browser journeys connect UI, API and persisted results.',
      'Guarded test databases prevent destructive fixtures touching production.',
    ],
    'tests/unit/ · tests/integration/ · tests/contract/ · tests/e2e/',
  ],
  GitHub: [
    'Source and automation',
    'Versions code and development context',
    'Git stores source, specifications, plans and evidence records. GitHub Actions runs the CI workflow; the connected Vercel project builds deployments from repository changes.',
    [
      'Secrets and generated artifacts are excluded.',
      'A plan’s tasks remain pending until implemented and verified.',
      'Preview isolation and final release acceptance remain separate work items.',
    ],
    '.github/workflows/ci.yml · AGENTS.md · specs/',
  ],
};
for (const name of Object.keys(tech)) {
  const b = document.createElement('button');
  b.textContent = name;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => showTech(name, b));
  $('#tech-buttons').append(b);
}
function showTech(name, button) {
  for (const b of $('#tech-buttons').children) {
    b.classList.toggle('active', b === button);
    b.setAttribute('aria-pressed', String(b === button));
  }
  const [type, title, description, points, reference] = tech[name];
  $('#tech-type').textContent = type;
  $('#tech-title').textContent = title;
  $('#tech-description').textContent = description;
  $('#tech-ref').textContent = reference;
  $('#tech-points').replaceChildren();
  for (const point of points) {
    const li = document.createElement('li');
    li.textContent = point;
    $('#tech-points').append(li);
  }
}
showTech('Neon', $('#tech-buttons').children[4]);
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          for (const a of document.querySelectorAll('.chapters a')) {
            if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          }
        }
    },
    { rootMargin: '-15% 0px -60% 0px' },
  );
  document.querySelectorAll('.chapter').forEach((section) => observer.observe(section));
}
