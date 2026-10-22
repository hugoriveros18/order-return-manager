const icons = {
  box: '<path d="m4 7 8-4 8 4v10l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4"/>',
  returns: '<path d="M8 7H4V3M4 7a9 9 0 1 1-1 8"/><path d="m9 13 2 2 4-4"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  route:
    '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h8a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  layers: '<path d="m3 7 9-4 9 4-9 4Zm0 5 9 4 9-4M3 17l9 4 9-4"/>',
  moon: '<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const states = {
  PENDING: {
    title: 'Pending review',
    icon: 'clock',
    tag: 'Units reserved',
    short: 'Your request is waiting for a decision.',
    owner: 'Customer submits the request',
    detail:
      'The customer selects products, quantities and a reason. A valid request reserves those units. While pending, the administrator can approve or reject it, or the customer can cancel it.',
  },
  APPROVED: {
    title: 'Approved',
    icon: 'check',
    tag: 'Units reserved',
    short: 'Awaiting fictitious pickup. Prepare your products.',
    owner: 'Administrator approves',
    detail:
      'The administrator approves the whole request. Pack the products for a simulated pickup within three business days. Units remain reserved. Approval does not issue a refund or confirm physical receipt.',
  },
  RECEIVED: {
    title: 'Return received',
    icon: 'box',
    tag: 'Final state',
    short: 'Fictitious receipt confirmed. The return is complete.',
    owner: 'Administrator confirms receipt',
    detail:
      'Only an approved request can be marked received. An administrator records this fictitious receipt; it is never automatic. The request is final and its units remain committed. No monetary refund is issued.',
  },
  REJECTED: {
    title: 'Rejected',
    icon: 'close',
    tag: 'Final state',
    short: 'A rejection reason is required. Units become available.',
    owner: 'Administrator rejects',
    detail:
      'Only a pending request can be rejected, and the administrator must provide a reason. All units in the request are released. This request is final; a new request must still meet the current eligibility rules.',
  },
  CANCELLED: {
    title: 'Cancelled',
    icon: 'returns',
    tag: 'Final state',
    short: 'The customer withdraws the request. Units are released.',
    owner: 'Customer cancels',
    detail:
      'The customer confirms cancellation while the request is pending. Its units become available again, subject to eligibility. The request cannot be reactivated, and approved requests cannot be cancelled.',
  },
};
const container = document.querySelector('#concept-content');
let concept = new URLSearchParams(location.search).get('concept') || 'a';
if (!['a', 'b', 'c'].includes(concept)) concept = 'a';
let selected = 'PENDING',
  scenario = 'approved';
const rationales = {
  a: 'Recommended · One compact map shows all five states and the four valid transitions at once. Selecting a state adds a short explanation. The clearest fit for this demo, with little extra interaction.',
  b: 'A focused learning experience · Switch between approval, rejection and cancellation to see one path at a time. More approachable step by step, but the complete state model takes more exploration.',
  c: 'A role-first explanation · Separates customer and administrator responsibilities. Helpful when learning both views, although it uses more space and takes longer to scan than the flow map.',
};
function node(state, extra = '') {
  const item = states[state];
  return `<button class="node ${extra}" data-state="${state}" aria-pressed="${selected === state}" aria-label="Learn about ${item.title}"><span class="node-top"><span class="state-icon">${icon(item.icon)}</span><span class="state-label">${item.tag}</span></span><h3>${item.title}</h3><p>${item.short}</p><span class="node-owner">${item.owner}</span></button>`;
}
function explanation() {
  const item = states[selected];
  return `<section class="selected-explanation" aria-live="polite" aria-atomic="true"><span class="state-icon">${icon(item.icon)}</span><div><h3>${item.title} — what it means</h3><p>${item.detail}</p></div></section>`;
}
function renderA() {
  return `<section class="panel" aria-labelledby="diagram-title"><div class="panel-heading"><div><h2 id="diagram-title">The complete picture</h2><p>Follow the arrows. Select any state to learn more.</p></div><span class="tag recommended">Recommended</span></div>
 <div class="flow-map" role="group" aria-label="All five return states and their allowed transitions">
 <svg class="map-lines" viewBox="0 0 1000 480" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="m1 1 8 4-8 4"/></marker></defs>
 <path d="M290 112H365" marker-end="url(#arrowhead)"/><text x="327" y="99" text-anchor="middle">Approve</text>
 <path d="M635 112H710" marker-end="url(#arrowhead)"/><text x="672" y="99" text-anchor="middle">Receive</text>
 <path d="M155 193V324H365" marker-end="url(#arrowhead)"/><text x="269" y="311" text-anchor="middle">Reject</text>
 <path d="M155 193V460H845V408" marker-end="url(#arrowhead)"/><text x="490" y="449" text-anchor="middle">Customer cancels · pending only</text></svg>
 ${node('PENDING')}${node('APPROVED')}${node('RECEIVED')}<p class="map-mobile-label">Alternative outcomes · Only from Pending review</p>${node('REJECTED')}${node('CANCELLED')}</div>${explanation()}</section>`;
}
const scenarios = {
  approved: {
    title: 'From request to completion.',
    description: 'A customer starts the request. An administrator approves and confirms receipt.',
    path: ['PENDING', 'APPROVED', 'RECEIVED'],
    caption: 'Receipt is a separate administrator action, not an automatic update.',
  },
  rejected: {
    title: 'A decision, with a clear reason.',
    description: 'The administrator declines a pending request and explains why.',
    path: ['PENDING', 'REJECTED'],
    caption: 'Rejection releases all units. The reason stays in the request history.',
  },
  cancelled: {
    title: 'A change of plans, before approval.',
    description: 'The customer confirms cancellation while the request is still pending.',
    path: ['PENDING', 'CANCELLED'],
    caption: 'An approved request cannot be cancelled. Cancelled requests cannot be reopened.',
  },
};
function renderB() {
  const journey = scenarios[scenario];
  return `<section class="panel" aria-labelledby="diagram-title"><div class="panel-heading"><div><h2 id="diagram-title">Choose a possible journey</h2><p>Three outcomes. One simple step at a time.</p></div></div><nav class="scenario-bar" aria-label="Return scenario">${[
    ['approved', 'Approval & receipt'],
    ['rejected', 'Rejection'],
    ['cancelled', 'Cancellation'],
  ]
    .map(
      ([key, label]) =>
        `<button data-scenario="${key}" aria-pressed="${scenario === key}">${label}</button>`,
    )
    .join(
      '',
    )}</nav><div class="journey-hero"><div><p class="eyebrow">${journey.path.length} states · ${scenario === 'cancelled' ? 'Customer action' : 'Customer + Administrator'}</p><h3>${journey.title}</h3><p>${journey.description}</p></div><div class="journey-emblem">${icon(scenario === 'approved' ? 'returns' : scenario === 'rejected' ? 'info' : 'clock')}</div></div><div class="journey-track" style="--steps:${journey.path.length}">${journey.path.map((state, index) => `<div class="journey-stop"><span class="step-caption">Step ${String(index + 1).padStart(2, '0')}</span>${node(state)}</div>`).join('')}</div><p class="journey-caption">${icon('info')}${journey.caption}</p>${explanation()}</section>`;
}
function renderC() {
  return `<section class="panel" aria-labelledby="diagram-title"><div class="panel-heading"><div><h2 id="diagram-title">Two roles. One shared request.</h2><p>Each action has an owner. Both views see the same history.</p></div></div><div class="role-grid"><section class="lane" aria-labelledby="customer-role"><header class="lane-heading"><span>${icon('user')}</span><div><h3 id="customer-role">Customer</h3><p>Choose, submit and follow progress</p></div></header><div class="action-card">${icon('box')}<h3>Request a return</h3><p>Select eligible products, quantities and a reason. Submitting creates a pending request.</p></div><div class="handoff">${icon('arrow')}Hand over to administrator review</div><div class="cancel-option"><p class="eyebrow" style="margin-bottom:12px">An alternative, while pending</p>${node('CANCELLED')}<p class="lane-note">Cancellation needs confirmation. Once approved, this option is no longer available.</p></div></section><section class="lane" aria-labelledby="admin-role"><header class="lane-heading"><span>${icon('shield')}</span><div><h3 id="admin-role">Administrator</h3><p>Review, decide and confirm receipt</p></div></header>${node('PENDING')}<div class="admin-branches"><div class="admin-chain">${node('APPROVED')}<div class="chain-arrow">${icon('down')}Confirm fictitious receipt</div>${node('RECEIVED')}</div><div class="admin-chain">${node('REJECTED')}<p class="end-note">The request ends here.</p></div></div><p class="lane-note"><strong>Every valid action is recorded.</strong> History includes its date, event and demonstration actor.</p></section></div>${explanation()}</section>`;
}
function render() {
  container.innerHTML = concept === 'a' ? renderA() : concept === 'b' ? renderB() : renderC();
  document.querySelector('#design-rationale').textContent = rationales[concept];
  document
    .querySelectorAll('[data-concept]')
    .forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.concept === concept)),
    );
  container.querySelectorAll('[data-state]').forEach((button) =>
    button.addEventListener('click', () => {
      selected = button.dataset.state;
      container
        .querySelectorAll('[data-state]')
        .forEach((node) =>
          node.setAttribute('aria-pressed', String(node.dataset.state === selected)),
        );
      container.querySelector('.selected-explanation').outerHTML = explanation();
    }),
  );
  container.querySelectorAll('[data-scenario]').forEach((button) =>
    button.addEventListener('click', () => {
      scenario = button.dataset.scenario;
      selected = 'PENDING';
      render();
      container.querySelector(`[data-scenario="${scenario}"]`).focus({ preventScroll: true });
    }),
  );
}
document
  .querySelectorAll('[data-icon]')
  .forEach((element) => (element.innerHTML = icon(element.dataset.icon)));
document.querySelectorAll('[data-concept]').forEach((button) => {
  button.dataset.mobileLabel = { a: 'Map', b: 'Journey', c: 'Roles' }[button.dataset.concept];
  button.addEventListener('click', () => {
    concept = button.dataset.concept;
    selected = 'PENDING';
    scenario = 'approved';
    history.replaceState(null, '', `?concept=${concept}`);
    render();
  });
});
const themeButton = document.querySelector('.theme-toggle');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}
try {
  setTheme(localStorage.getItem('orm-guide-theme') || 'light');
} catch {
  setTheme('light');
}
themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  try {
    localStorage.setItem('orm-guide-theme', next);
  } catch {}
});
render();
