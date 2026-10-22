/* Interactive design study. All actions affect in-memory sample data only. */
const app = document.querySelector('#app');
const ASSETS = '../../public/';
const params = new URLSearchParams(location.search);
const paths = {
  box: '<path d="m4 7 8-4 8 4v10l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 11v10M8 5l8 4"/>',
  returns: '<path d="M8 7H4V3M4 7a9 9 0 1 1-1 8"/><path d="m9 13 2 2 4-4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  admin: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  refresh: '<path d="M20 4v6h-6M4 20v-6h6M5 8a8 8 0 0 1 13-3l2 5M4 14l2 5a8 8 0 0 0 13-3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  leaf: '<path d="M5 19c-4-11 7-15 15-15 0 9-4 19-15 15Zm0 0 10-9"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.box}</svg>`;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const money = (n) => `USD ${(n / 100).toFixed(2)}`;
const productData = [
  {
    id: 'keyboard',
    name: 'Nivora KeyForm T84',
    category: 'Wireless mechanical keyboard',
    price: 7999,
    image: 'keyform-t84',
    bought: 2,
    max: 2,
  },
  {
    id: 'mouse',
    name: 'Nivora FlowGrip M6',
    category: 'Ergonomic wireless mouse',
    price: 3999,
    image: 'flowgrip-m6',
    bought: 2,
    max: 1,
  },
  {
    id: 'stand',
    name: 'Nivora LiftStand A1',
    category: 'Adjustable aluminium laptop stand',
    price: 3499,
    image: 'liftstand-a1',
    bought: 1,
    max: 1,
  },
  {
    id: 'headset',
    name: 'Nivora AirTone H5',
    category: 'Wireless over-ear headphones',
    price: 6999,
    image: 'airtone-h5',
    bought: 1,
    max: 1,
  },
  {
    id: 'hub',
    name: 'Nivora LinkHub 6',
    category: 'Compact six-port USB-C hub',
    price: 4999,
    image: 'linkhub-6',
    bought: 1,
    max: 1,
  },
];
const orders = [
  {
    id: '1042',
    date: 'Oct 14, 2026',
    delivered: 'Oct 18, 2026',
    deadline: 'Nov 17, 2026',
    status: 'Delivered',
    eligible: true,
    items: [0, 1, 2],
  },
  {
    id: '1043',
    date: 'Oct 5, 2026',
    delivered: 'Oct 8, 2026',
    deadline: 'Nov 7, 2026',
    status: 'Delivered',
    eligible: true,
    items: [3, 4],
  },
  {
    id: '1044',
    date: 'Sep 2, 2026',
    delivered: 'Sep 6, 2026',
    deadline: 'Oct 6, 2026',
    status: 'Delivered',
    eligible: false,
    items: [0, 4],
  },
  {
    id: '1045',
    date: 'Oct 20, 2026',
    delivered: 'Not delivered yet',
    deadline: null,
    status: 'Processing',
    eligible: false,
    items: [2, 3],
  },
];
const sampleRequests = () => [
  {
    id: 'RET-0284',
    order: '1042',
    customer: 'Alex Morgan',
    status: 'PENDING',
    date: 'Oct 21, 10:42 AM',
    reason: 'The keyboard is too large for my workspace.',
    items: [{ id: 'keyboard', quantity: 1 }],
    events: [['Request created', 'Alex Morgan · Customer', 'Oct 21, 10:42 AM']],
  },
  {
    id: 'RET-0283',
    order: '1043',
    customer: 'Jordan Lee',
    status: 'APPROVED',
    date: 'Oct 20, 3:15 PM',
    reason: 'I would prefer a different fit.',
    items: [{ id: 'headset', quantity: 1 }],
    events: [
      ['Request created', 'Jordan Lee · Customer', 'Oct 20, 3:15 PM'],
      ['Request approved', 'Administrator', 'Oct 20, 4:10 PM'],
    ],
  },
  {
    id: 'RET-0281',
    order: '1042',
    customer: 'Alex Morgan',
    status: 'RECEIVED',
    date: 'Oct 18, 9:20 AM',
    reason: 'The mouse does not suit my workspace.',
    items: [{ id: 'mouse', quantity: 1 }],
    events: [
      ['Request created', 'Alex Morgan · Customer', 'Oct 18, 9:20 AM'],
      ['Request approved', 'Administrator', 'Oct 18, 11:05 AM'],
      ['Simulated receipt confirmed', 'Administrator', 'Oct 20, 2:35 PM'],
    ],
  },
  {
    id: 'RET-0279',
    order: '1044',
    customer: 'Jordan Lee',
    status: 'REJECTED',
    date: 'Oct 16, 2:30 PM',
    reason: 'I no longer need the adapter.',
    rejection: 'The request does not meet the demonstration return policy.',
    items: [{ id: 'hub', quantity: 1 }],
    events: [
      ['Request created', 'Jordan Lee · Customer', 'Oct 16, 2:30 PM'],
      ['Request rejected', 'Administrator', 'Oct 16, 4:00 PM'],
    ],
  },
];
const labels = {
  PENDING: 'Pending review',
  APPROVED: 'Approved — awaiting pickup',
  RECEIVED: 'Return received',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};
const state = {
  concept: ['a', 'b', 'c'].includes(params.get('concept')) ? params.get('concept') : 'a',
  screen: 'home',
  role: 'customer',
  customer: 'Alex Morgan',
  order: '1042',
  detail: false,
  drawer: false,
  quantities: {},
  reason: '',
  error: '',
  filter: 'ALL',
  request: 'RET-0284',
  requestDetail: false,
  requests: sampleRequests(),
  windowDays: 30,
  modal: null,
  toast: '',
  created: null,
};
const concepts = {
  a: {
    name: 'Clarity',
    tag: 'Persistent order navigator',
    colors: ['#f3f6fa', '#ffffff', '#183b56', '#2563a6', '#e7eff8'],
    description:
      'A calm workspace with an order navigator and a stable detail panel. Selecting another order changes the panel in place.',
    advice:
      'Best for comparing several orders and moving quickly between purchases. The administrator uses a persistent review queue.',
    tradeoff:
      'Two columns need more desktop space. On mobile, orders use a compact chooser above the detail.',
  },
  b: {
    name: 'Studio',
    tag: 'A familiar purchase gallery',
    colors: ['#f8f6f1', '#ffffff', '#174c42', '#c88a36', '#eaf0e9'],
    description:
      'Product-led order cards, simple top navigation and a distinct purchase detail page. Return creation is a centred, guided flow.',
    advice:
      'My recommendation for this MVP: it feels familiar to a customer and makes the difference between the order list and detail unmistakable.',
    tradeoff:
      'Inspecting a different order means going back to the gallery. The list retains its position and selected profile.',
  },
  c: {
    name: 'Console',
    tag: 'Table and side-panel workspace',
    colors: ['#f4f5f7', '#ffffff', '#252e3c', '#a96010', '#fff1dc'],
    description:
      'A compact order table with details in a side panel. Close the panel and the original list, filters and position are still there.',
    advice:
      'Best for the administrative experience and frequent review. Status tabs filter the loaded request list in place.',
    tradeoff:
      'Tables feel more operational than a shopping account. On mobile the detail panel becomes a full-screen sheet.',
  },
};
const currentOrder = () => orders.find((o) => o.id === state.order) || orders[0];
const itemsFor = (order) => order.items.map((i) => productData[i]);
const orderTotal = (order) => itemsFor(order).reduce((n, p) => n + p.price * p.bought, 0);
const selectedItems = () =>
  productData
    .filter((p) => state.quantities[p.id] > 0)
    .map((p) => ({ ...p, quantity: state.quantities[p.id] }));
const image = (p, cls = 'product-image') =>
  `<img class="${cls}" src="${ASSETS}products/nivora-${p.image}.webp" alt="${escape(p.name)}" width="144" height="144">`;
const badge = (status) =>
  `<span class="pill ${status.toLowerCase()}">${icon(status === 'PENDING' ? 'clock' : status === 'RECEIVED' ? 'check' : 'box')}${labels[status]}</span>`;
const orderBadge = (o) =>
  `<span class="pill ${o.status === 'Delivered' ? 'good' : 'neutral'}">${icon(o.status === 'Delivered' ? 'check' : 'clock')}${o.status}</span>`;
const btn = (text, action, cls = '', extra = '') =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const back = (text, action) =>
  `<button class="back" data-action="${action}">${icon('left')}${text}</button>`;
function brand() {
  return `<button class="brand" data-action="home" aria-label="Order Returns Manager home"><span class="brand-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m8 9 8-4 8 4v10l-8 4-8-4V9Zm0 0 8 4 8-4M16 13v5M26 23a7 7 0 0 1-11 5m0 0v-5m0 5h5"/></svg></span><span class="brand-text">Order Returns Manager<span>Fictional purchases. Clear next steps.</span></span></button>`;
}
function navItems() {
  const admin = state.role === 'admin';
  const items = admin
    ? [
        ['admin', 'returns', 'Requests'],
        ['policy', 'settings', 'Return policy'],
      ]
    : [
        ['orders', 'box', 'Orders'],
        ['returns', 'returns', 'My returns'],
      ];
  return items
    .map(
      ([screen, glyph, label]) =>
        `<button class="nav-item ${state.screen === screen ? 'active' : ''}" data-action="nav-${screen}" ${state.screen === screen ? 'aria-current="page"' : ''}>${icon(glyph)}<span class="nav-text">${label}</span>${screen === 'admin' ? `<span class="count">${state.requests.filter((r) => r.status === 'PENDING').length}</span>` : ''}</button>`,
    )
    .join('');
}
function header() {
  return `<header class="app-header">${brand()}<div class="context-controls"><div class="role-switch" role="group" aria-label="Demonstration view"><button data-action="role-customer" aria-pressed="${state.role === 'customer'}">${icon('user')}Customer</button><button data-action="role-admin" aria-pressed="${state.role === 'admin'}">${icon('admin')}Administrator</button></div><div class="profile"><span class="avatar">${state.role === 'admin' ? 'DM' : state.customer === 'Alex Morgan' ? 'AM' : 'JL'}</span>${state.role === 'customer' ? `<div><label class="context-label" for="customer-choice">Fictional customer</label><span class="select-wrap"><select id="customer-choice" aria-label="Fictional customer"><option ${state.customer === 'Alex Morgan' ? 'selected' : ''}>Alex Morgan</option><option ${state.customer === 'Jordan Lee' ? 'selected' : ''}>Jordan Lee</option></select></span></div>` : '<div class="admin-identity"><strong>Demo administrator</strong><span class="context-label">Your workspace only</span></div>'}</div></div></header><div class="notice">${icon('info')}<span>Demonstration only. No real refunds, shipments or pickups.</span><span class="right">Interactive prototype · sample data</span></div>`;
}
function settingsNav() {
  return `<button class="nav-item ${['settings', 'policy'].includes(state.screen) ? 'active' : ''}" data-action="nav-settings" aria-label="Demo settings">${icon('settings')}<span class="nav-text settings-text">Demo settings</span></button>`;
}
function shell(content) {
  const inner = `<main class="main" id="content"><div class="main-inner">${content}</div></main>`;
  if (state.concept === 'b')
    return `<div class="top-layout">${header()}<nav class="top-nav" aria-label="Main navigation">${navItems()}${settingsNav()}</nav>${inner}</div>`;
  return `<div class="${state.concept === 'c' ? 'compact-header' : ''}">${header()}<div class="layout"><nav class="sidebar" aria-label="Main navigation"><p class="nav-label">Your workspace</p>${navItems()}<div class="sidebar-foot">${settingsNav()}<p>Your demo is private to this browser. Reset it whenever you want to start fresh.</p></div></nav>${inner}</div></div>`;
}
function heading(title, desc, action = '') {
  return `<div class="page-heading"><div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>${action}</div>`;
}
function home() {
  const c = state.concept;
  let visual;
  if (c === 'b')
    visual = `<div class="gallery-collage">${[productData[0], productData[3], productData[1], productData[4]].map((p) => `<div class="gallery-tile">${image(p, '')}<span>${p.category}</span></div>`).join('')}</div>`;
  else if (c === 'c')
    visual = `<div class="desk-demo"><div class="desk-demo-head"><i></i><i></i><i></i><span>Your demo workspace</span></div><div class="desk-demo-body"><div class="mini-nav"><strong>Your orders</strong><span>My returns</span><span>Demo settings</span></div><div class="mini-main"><h3>Your recent purchases</h3>${orders
      .slice(0, 3)
      .map(
        (o, i) =>
          `<div class="scene-row">${image(productData[i], '')}<strong>ORM-${o.id}</strong><span class="pill good">Delivered</span></div>`,
      )
      .join(
        '',
      )}</div></div><div class="desk-demo-footer">Open an order. Choose your next step.</div></div>`;
  else
    visual = `<div class="preview-scene"><div class="scene-arch"></div><div class="scene-window"><div class="scene-head"><strong>Order ORM-1042</strong><span class="pill good">${icon('check')}Delivered</span></div><div class="scene-products">${productData
      .slice(0, 3)
      .map((p) => image(p, ''))
      .join(
        '',
      )}</div><div class="scene-row"><span>Purchased on Oct 14</span><strong>3 products</strong></div><div class="scene-row"><span>Return window</span><span class="pill good">Open until Nov 17</span></div><div class="scene-bottom"><span class="mini-check">${icon('check')}</span><div><strong>Your purchases, in one place</strong><p>View an order or start a return when you need to.</p></div></div></div></div>`;
  const titles = {
    a: 'Your orders.<br>A clearer next step.',
    b: 'A little room<br>to change your mind.',
    c: 'Every order.<br>One clear workspace.',
  };
  const descriptions = {
    a: 'Find your purchases, choose what to return and follow the decision. A straightforward experience from start to finish.',
    b: 'Browse your purchases, revisit the details and request a return at your own pace. We’ll keep every step easy to follow.',
    c: 'Browse purchases and manage returns without losing your place. Move between customer and administrator views in the same demo.',
  };
  return `<header class="landing-header">${brand()}<button class="text-link" data-action="comparison">Compare designs</button></header><main id="content" class="landing-main"><div class="landing-hero ${c === 'b' ? 'gallery-hero' : c === 'c' ? 'desk-hero' : ''}"><section class="landing-copy">${c === 'b' ? '<span class="pill good">Made for a clear return journey</span>' : ''}<h1>${titles[c]}</h1><p>${descriptions[c]}</p><div class="landing-cta">${btn('Explore the demo ' + icon('arrow'), 'start')}<button class="text-link" data-action="start-admin">Try administrator view</button></div><p class="cta-note">No account needed. Your own fictional customers and orders.<br>Changes stay inside this interactive preview.</p></section>${visual}</div><div class="landing-features">${[
    [
      'box',
      'Start with your purchase',
      'See the products, quantities and original USD prices in each order.',
    ],
    [
      'returns',
      'Follow every step',
      'Request a return, review a decision and see the history in one place.',
    ],
    [
      'refresh',
      'Make it your own demo',
      'Switch views, try a different outcome or reset your sample data.',
    ],
  ]
    .map(
      ([glyph, title, desc]) =>
        `<section class="landing-feature">${icon(glyph)}<div><h2>${title}</h2><p>${desc}</p></div></section>`,
    )
    .join(
      '',
    )}</div><footer class="landing-footer">All products and customer profiles are fictional. This prototype does not issue refunds or arrange real pickups.</footer></main>`;
}
function orderProducts(order) {
  return `<div class="products">${itemsFor(order)
    .map(
      (p) =>
        `<div class="product">${image(p)}<div><h3>${p.name}</h3><p>${p.category}</p><p>Quantity ${p.bought}</p></div><div class="product-price">${money(p.price * p.bought)}<small>${money(p.price)} each</small></div></div>`,
    )
    .join('')}</div>`;
}
function returnCallout(o) {
  return o.eligible
    ? `<div class="return-callout"><div><h3>Need to return something?</h3><p>You can request a full or partial return until ${o.deadline}.</p></div>${btn('Request return', 'begin-return')}</div>`
    : `<div class="return-callout"><div><h3>${o.status === 'Processing' ? 'Your order is still being prepared' : 'The return window has closed'}</h3><p>${o.status === 'Processing' ? 'You can request a return after delivery, within the return window.' : `This order’s return window ended on ${o.deadline}.`}</p></div></div>`;
}
function orderDetail(o, withCallout = true) {
  return `<section class="panel order-detail"><header class="detail-header"><div class="detail-title"><h2>Order ORM-${o.id}</h2>${orderBadge(o)}</div><div class="detail-meta"><span>Purchased<strong>${o.date}</strong></span><span>${o.status === 'Delivered' ? 'Delivered' : 'Delivery'}<strong>${o.delivered}</strong></span></div></header>${orderProducts(o)}<div class="order-summary"><div class="total-line"><span>Order total · ${itemsFor(o).reduce((n, p) => n + p.bought, 0)} items</span><strong>${money(orderTotal(o))}</strong></div></div>${withCallout ? returnCallout(o) : ''}</section>`;
}
function orderNavigator() {
  return `<aside class="panel order-browser" aria-label="Choose an order">${orders
    .map(
      (o) =>
        `<button class="order-option ${state.order === o.id ? 'active' : ''}" data-action="order" data-id="${o.id}" aria-pressed="${state.order === o.id}"><div class="order-option-head"><strong>ORM-${o.id}</strong>${icon('right')}</div><p>${o.date} · ${o.items.length} products</p><div class="order-option-bottom"><div class="order-thumbs">${itemsFor(
          o,
        )
          .slice(0, 2)
          .map((p) => image(p, ''))
          .join('')}</div>${orderBadge(o)}</div></button>`,
    )
    .join('')}</aside>`;
}
function ordersScreen() {
  const o = currentOrder();
  const title = heading(
    'Your orders',
    'Your purchases, with the details you need.',
    btn('My returns', 'nav-returns', 'secondary'),
  );
  const note = `<p class="footnote">${icon('info')}Original purchase prices in USD. All products and orders are fictional.</p>`;
  if (state.concept === 'a')
    return `${title}<div class="split">${orderNavigator()}<div>${orderDetail(o)}${note}</div></div>`;
  if (state.concept === 'b') {
    if (state.detail)
      return `${back('All orders', 'back-orders')}${heading('Your purchase', `Everything in order ORM-${o.id}, in one place.`)}<div class="gallery-detail">${orderDetail(o, false)}<aside><section class="purchase-note"><h3>${o.eligible ? 'A return, if you need it' : o.status === 'Processing' ? 'On its way to you' : 'About this purchase'}</h3><p>${o.eligible ? `You have until ${o.deadline} to request a return. Choose individual products or return everything in this order.` : o.status === 'Processing' ? 'Return options become available once your order has been delivered.' : `The return window ended on ${o.deadline}. Your purchase details remain available here.`}</p><div class="summary-list"><div><span>Return window</span><strong>${o.eligible ? 'Open' : o.status === 'Processing' ? 'Not started' : 'Closed'}</strong></div><div><span>Original order total</span><strong>${money(orderTotal(o))}</strong></div></div>${o.eligible ? btn('Request return', 'begin-return') : ''}</section>${note}</aside></div>`;
    return `${title}<div class="order-cards">${orders
      .map(
        (order) =>
          `<article class="order-card"><div class="card-top"><div><strong>Order ORM-${order.id}</strong><small>${order.date}</small></div>${orderBadge(order)}</div><div class="card-images">${itemsFor(
            order,
          )
            .map((p) => image(p, ''))
            .join(
              '',
            )}</div><div class="card-bottom"><span>${order.items.length} products · ${money(orderTotal(order))}</span><button data-action="order" data-id="${order.id}">View order ${icon('right')}</button></div></article>`,
      )
      .join('')}</div>${note}`;
  }
  return `${title}<div class="panel table-panel"><table class="order-table"><thead><tr><th scope="col">Order</th><th scope="col" class="table-products-col">Products</th><th scope="col">Status</th><th scope="col" class="table-total-col">Total</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${orders
    .map(
      (order) =>
        `<tr><td><strong>ORM-${order.id}</strong><small>${order.date}</small></td><td class="table-products-col"><div class="table-product">${itemsFor(
          order,
        )
          .slice(0, 2)
          .map((p) => image(p, ''))
          .join(
            '',
          )}<span>${order.items.length} products</span></div></td><td>${orderBadge(order)}</td><td class="table-total-col">${money(orderTotal(order))}</td><td><button class="text-link" data-action="order" data-id="${order.id}" aria-label="View order ORM-${order.id}">View ${icon('right')}</button></td></tr>`,
    )
    .join(
      '',
    )}</tbody></table><div class="table-caption">4 orders · Select View to inspect a purchase without leaving the list.</div></div>${note}${state.drawer ? drawer(orderDetail(o), 'Order details') : ''}`;
}
function steps(active) {
  return `<nav class="steps" aria-label="Return request progress">${['Choose products', 'Review request', 'Confirmation'].map((text, i) => `${i ? '<span class="step-line"></span>' : ''}<span class="step ${active === i ? 'active' : ''}" ${active === i ? 'aria-current="step"' : ''}><span>${i < active ? icon('check') : i + 1}</span>${text}</span>`).join('')}</nav>`;
}
function quantitySlot(p) {
  const n = state.quantities[p.id] || 0;
  return `<div class="choice-slot">${n ? `<div class="quantity-control" role="group" aria-label="Return quantity for ${p.name}"><button data-action="minus" data-id="${p.id}" aria-label="${n === 1 ? 'Remove' : 'Decrease quantity for'} ${p.name}">${icon(n === 1 ? 'close' : 'minus')}</button><output aria-label="Selected quantity">${n}</output><button data-action="plus" data-id="${p.id}" aria-label="Increase quantity for ${p.name}" ${n >= p.max ? 'disabled' : ''}>${icon('plus')}</button></div><span class="quantity-note">${n} of ${p.max} returnable</span>` : `<button class="add-product" data-action="add" data-id="${p.id}">${icon('plus')}Add to return</button><span class="quantity-note">${p.max} ${p.max === 1 ? 'unit' : 'units'} returnable</span>`}</div>`;
}
function chooseProducts() {
  const o = currentOrder();
  const selected = selectedItems();
  return `<div class="center-flow">${back('Back to order', 'back-detail')}${steps(0)}<div class="flow-heading"><h1>What would you like to return?</h1><p>Order ORM-${o.id}. Choose the products and quantities that work for you.</p></div><form id="return-form" class="panel"><div class="form-top"><div><h2>Products in this order</h2><p>Add products below, then tell us why.</p></div><button type="button" class="text-link" data-action="select-all">Select all available</button></div><div class="selection-list">${itemsFor(
    o,
  )
    .map(
      (p) =>
        `<div class="selection-product ${state.quantities[p.id] ? 'selected' : ''}" data-product="${p.id}">${image(p)}<div><h3>${p.name}</h3><p>${money(p.price)} each · ${p.bought} purchased</p>${p.max < p.bought ? '<p class="availability-note">1 unit already in a return</p>' : ''}</div>${quantitySlot(p)}</div>`,
    )
    .join(
      '',
    )}</div><div class="form-reason"><label for="return-reason">Why are you returning these products?</label><textarea id="return-reason" placeholder="Tell us what didn’t work for you…" aria-describedby="reason-hint ${state.error ? 'form-error' : ''}" ${state.error ? 'aria-invalid="true"' : ''}>${escape(state.reason)}</textarea><small id="reason-hint">One reason for your selection. Use up to 1,000 characters. Please leave out real personal information.</small></div>${state.error ? `<p class="error" id="form-error" role="alert">${escape(state.error)}</p>` : ''}<footer class="form-footer"><p><strong>${selected.length ? `${selected.length} ${selected.length === 1 ? 'product' : 'products'} selected · ${selected.reduce((n, p) => n + p.quantity, 0)} units` : 'Choose at least one product'}</strong>You’ll review everything before creating the request.</p>${btn('Review request ' + icon('arrow'), 'review')}</footer></form><p class="footnote">${icon('info')}This is a demonstration. No real pickup or refund will be arranged.</p></div>`;
}
function selectedProducts(items) {
  return `<div class="products">${items
    .map((item) => {
      const p = productData.find((p) => p.id === item.id) || item;
      return `<div class="product">${image(p)}<div><h3>${p.name}</h3><p>${item.quantity} ${item.quantity === 1 ? 'unit' : 'units'} · ${money(p.price)} each</p></div><span class="product-price">${money(p.price * item.quantity)}</span></div>`;
    })
    .join('')}</div>`;
}
function reviewRequest() {
  const selected = selectedItems();
  return `<div class="center-flow">${back('Edit your selection', 'edit-selection')}${steps(1)}<div class="flow-heading"><h1>Everything look right?</h1><p>Check the products, quantities and reason before creating your request.</p></div><div class="review-layout"><section class="panel"><h2 class="section-title">Your return selection</h2>${selectedProducts(selected)}<div class="reason-summary"><h3>Your return reason</h3><p>${escape(state.reason)}</p></div></section><aside class="review-aside"><h2>Request summary</h2><div class="summary-list"><div><span>Order</span><strong>ORM-${state.order}</strong></div><div><span>Products</span><strong>${selected.length}</strong></div><div><span>Units</span><strong>${selected.reduce((n, p) => n + p.quantity, 0)}</strong></div></div><p>The next step is an administrator review. Creating or approving this request does not issue a refund.</p>${btn('Create request', 'create')}${btn('Edit selection', 'edit-selection', 'secondary')}</aside></div></div>`;
}
function success() {
  const r = state.created || state.requests[0];
  return `<div class="center-flow">${steps(2)}<section class="success-card"><div class="success-icon">${icon('check')}</div><div class="success-meta"><strong>${r.id}</strong>${badge('PENDING')}</div><h1>Your return request is ready</h1><p>We’ve saved your request for order ORM-${r.order}. You can follow its progress in My returns.</p><div class="next-step"><h3>What happens next?</h3><p>An administrator reviews the full request. You’ll find the decision and any next steps in your return details. While it’s pending, you can still cancel it.</p></div><div class="success-actions">${btn('View return request', 'view-created')}${btn('Back to orders', 'back-orders', 'secondary')}</div><p class="footnote">${icon('info')}Demonstration only. No refund or physical pickup has been arranged.</p></section></div>`;
}
function timeline(r) {
  return `<section class="timeline"><h3>Request history</h3><ol>${r.events.map(([title, actor, date]) => `<li><strong>${escape(title)}</strong><small>${escape(actor)} · ${date}</small></li>`).join('')}</ol></section>`;
}
function instructions(r) {
  if (r.status === 'APPROVED')
    return `<div class="request-instructions"><span class="setting-icon">${icon('box')}</span><div><h3>Prepare your products</h3><p>Pack the selected products. Pickup is simulated within the next three business days. No real carrier will be sent, and no monetary refund is issued.</p></div></div>`;
  if (r.status === 'RECEIVED')
    return `<div class="request-instructions"><span class="setting-icon">${icon('check')}</span><div><h3>Simulated receipt confirmed</h3><p>This demonstration return is complete. No monetary refund has been issued.</p></div></div>`;
  if (r.status === 'REJECTED')
    return `<div class="reason-summary"><h3>Rejection reason</h3><p>${escape(r.rejection || 'The request does not meet the demonstration return policy.')}</p></div>`;
  return '';
}
function requestDetail(r, admin = false) {
  return `<section class="panel admin-detail"><header class="detail-header"><div class="detail-title"><h2>${r.id}</h2>${badge(r.status)}</div><div class="detail-meta"><span>${admin ? 'Customer' : 'Order'}<strong>${admin ? escape(r.customer) : 'ORM-' + r.order}</strong></span><span>${admin ? 'Order' : 'Created'}<strong>${admin ? 'ORM-' + r.order : r.date}</strong></span></div></header>${selectedProducts(r.items)}<div class="reason-summary admin-reason"><h3>${admin ? 'Customer reason' : 'Your return reason'}</h3><p>${escape(r.reason)}</p></div>${instructions(r)}${admin ? (r.status === 'PENDING' ? `<div class="decision-bar">${btn('Approve request', 'approve')}${btn('Reject with reason', 'reject', 'secondary')}</div>` : r.status === 'APPROVED' ? `<div class="decision-bar">${btn('Confirm simulated receipt', 'receive')}</div>` : '') : r.status === 'PENDING' ? `<div class="decision-bar">${btn('Cancel request', 'cancel', 'secondary')}</div>` : ''}${timeline(r)}<div class="request-disclaimer">Approval records a demo decision. It does not issue a refund or confirm physical receipt.</div></section>`;
}
function filters() {
  return `<nav class="filters" aria-label="Filter return requests">${[['ALL', 'All requests'], ...Object.entries(labels)].map(([value, label]) => `<button class="filter ${state.filter === value ? 'active' : ''}" data-action="filter" data-value="${value}" aria-pressed="${state.filter === value}">${label}<span>${state.requests.filter((r) => value === 'ALL' || r.status === value).length}</span></button>`).join('')}</nav>`;
}
function requestTable(requests, admin) {
  return `<div class="panel table-panel request-table"><table class="order-table"><thead><tr><th scope="col">Request</th>${admin ? '<th scope="col" class="table-products-col">Customer</th>' : ''}<th scope="col">Status</th><th scope="col" class="table-total-col">Products</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody>${requests
    .map(
      (r) =>
        `<tr><td><strong>${r.id}</strong><small>Order ORM-${r.order}</small></td>${admin ? `<td class="table-products-col">${escape(r.customer)}</td>` : ''}<td>${badge(r.status)}</td><td class="table-total-col"><div class="table-product">${r.items
          .map((i) =>
            image(
              productData.find((p) => p.id === i.id),
              '',
            ),
          )
          .join(
            '',
          )}<span>${r.items.reduce((n, i) => n + i.quantity, 0)} units</span></div></td><td><button class="text-link" data-action="open-request" data-id="${r.id}" aria-label="View request ${r.id}">View ${icon('right')}</button></td></tr>`,
    )
    .join(
      '',
    )}</tbody></table><div class="table-caption">${requests.length} ${requests.length === 1 ? 'request' : 'requests'}${admin ? ' · Decisions apply to the entire request.' : ''}</div></div>`;
}
function adminScreen() {
  const requests = state.requests.filter(
    (r) => state.filter === 'ALL' || r.status === state.filter,
  );
  let r = state.requests.find((r) => r.id === state.request);
  if (r) state.request = r.id;
  const top = heading(
    'Return requests',
    'Review the products and reason, then make a decision.',
    btn(icon('refresh') + 'Refresh', 'refresh', 'secondary'),
  );
  const empty = `<section class="panel empty-view"><h2>No requests in this view</h2><p>Choose another status to see the rest of your requests.</p></section>`;
  if (state.concept === 'b' && state.requestDetail && r)
    return `${back('All requests', 'back-requests')}<div class="center-flow">${heading('Review a return', `A complete view of ${r.id}.`)}${requestDetail(r, true)}</div>`;
  if (state.concept === 'a')
    return `${top}${filters()}<div class="split"><aside class="panel queue" aria-label="Request queue">${requests.length ? requests.map((v) => `<button class="queue-item ${r?.id === v.id ? 'active' : ''}" data-action="open-request" data-id="${v.id}" aria-pressed="${r?.id === v.id}"><div class="queue-item-head"><strong>${v.id}</strong><small>${v.date.split(',')[0]}</small></div><p>${escape(v.customer)} · ORM-${v.order}</p>${badge(v.status)}</button>`).join('') : '<div class="empty-view"><p>No matching requests</p></div>'}</aside><div class="stable-detail">${r ? requestDetail(r, true) : empty}</div></div>`;
  return `${top}${filters()}<div class="stable-table">${requests.length ? requestTable(requests, true) : empty}</div>${state.concept === 'c' && state.drawer && r ? drawer(requestDetail(r, true), 'Review return request') : ''}`;
}
function returnsScreen() {
  const requests = state.requests.filter((r) => r.customer === state.customer);
  const r = requests.find((r) => r.id === state.request);
  if (state.requestDetail && r)
    return `<div class="center-flow">${back('My returns', 'back-requests')}${heading('Your return', `Updates and next steps for order ORM-${r.order}.`)}${requestDetail(r)}</div>`;
  return `${heading('My returns', 'Your requests, decisions and next steps in one place.')}${requests.length ? requestTable(requests, false) : '<div class="panel empty-view"><h2>No returns yet</h2><p>Start from a delivered order when you need to return something.</p><br>' + btn('Browse orders', 'back-orders') + '</div>'}`;
}
function settingsScreen(policyOnly = false) {
  return `<div class="settings-wrap">${heading(policyOnly ? 'Return policy' : 'Demo settings', policyOnly ? 'A clear return window for new requests.' : 'Your workspace, your settings.')}<div class="context-note">${icon(state.role === 'admin' ? 'admin' : 'user')}<span>You’re in ${state.role === 'admin' ? 'Administrator' : 'Customer'} view. Settings keep you in this view.</span></div><div class="panel">${!policyOnly ? `<section class="setting-section"><div class="setting-icon">${icon('lock')}</div><div><h2>Your own demonstration</h2><p>Both views share this browser’s fictional orders and requests. Changes here don’t affect another visitor’s demo. Your customer selection stays local to this tab.</p></div></section>` : ''}${state.role === 'admin' ? `<section class="setting-section"><div class="setting-icon">${icon('clock')}</div><div><h2>Return window</h2><p>New requests can be created within this many calendar days after delivery. Changes don’t alter existing requests or decisions.</p><div class="setting-value"><label for="window-days">Calendar days</label><input id="window-days" type="number" min="1" max="3650" value="${state.windowDays}"></div>${btn('Save return window', 'save-policy', 'secondary')}</div></section>` : ''}${!policyOnly ? `<section class="setting-section"><div class="setting-icon">${icon('clock')}</div><div><h2>Temporary by design</h2><p>Demo data expires after seven days without activity. After expiry, you’ll be asked to start a new demonstration. Nothing restarts silently.</p></div></section><section class="setting-section danger-zone"><div class="setting-icon">${icon('refresh')}</div><div><h2>Start fresh</h2><p>Restore your demo to its original state whenever you want to try a different journey.</p><ul><li>Remove the requests and history from this workspace.</li><li>Restore the initial orders and 30-day return window.</li><li>Keep other visitors’ demonstrations unchanged.</li></ul>${btn('Reset demonstration', 'reset', 'secondary')}</div></section>` : ''}</div><p class="footnote">${icon('info')}Preview controls change sample data only. No live application data is changed.</p></div>`;
}
function drawer(content, title) {
  return `<div class="drawer-shade" data-action="close-drawer"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="${title}" tabindex="-1"><header class="drawer-head"><span>${title}</span><button class="icon-button" data-action="close-drawer" aria-label="Close detail panel">${icon('close')}</button></header>${content}</aside>`;
}
function comparison() {
  return `<main id="content"><header class="compare-header"><h1>Three ways to make returns feel clearer.</h1><p>Compare the layout and navigation, then try the same complete journey in each design.</p></header><div class="compare-grid">${Object.entries(
    concepts,
  )
    .map(
      ([key, c]) =>
        `<article class="compare-card"><span class="concept-tag">Alternative ${key.toUpperCase()}</span><h2>${c.name}</h2><div class="swatches" aria-label="Color palette">${c.colors.map((color) => `<i style="background:${color}" title="${color}"></i>`).join('')}</div><div class="wireframe ${key}" aria-label="${c.tag}" role="img"><i></i><i></i><i></i></div><h3>${c.tag}</h3><p>${c.description}</p><h3>When I’d choose it</h3><p>${c.advice}</p><h3>Tradeoff</h3><p>${c.tradeoff}</p>${btn('Explore ' + c.name, 'explore-concept', '', `data-value="${key}"`)}</article>`,
    )
    .join(
      '',
    )}</div><section class="common-principles"><h2>Shared improvements</h2><p>Orders read like purchases: product, purchased quantity and price. Return availability appears only when choosing products to return. Product selection has a reserved quantity-control area, so images and names stay put. The review includes product imagery, and confirmation and settings use a centred reading width. Navigation, forms and action groups use consistent spacing.</p><p class="recommendation">Recommended direction: Studio for a clear customer experience; its separate order list and detail resolve the duplicate-screen problem. Keep administrative review quick with a table and a dedicated evidence page.</p><h2 class="comparison-subhead">How a real implementation would stay smooth</h2><p>Load a complete, bounded order list for the selected demo/customer once and reuse it for order selection. Load request pages into a demo-scoped session cache and filter loaded results locally; request additional pages only when needed. Keep the previous content visible during explicit refresh, update affected rows after a mutation, and invalidate on reset or customer change. Fresh server checks still decide whether a return is allowed. These previews use in-memory sample data; the application’s data-fetching behaviour has not been changed.</p></section></main>`;
}
function modal() {
  if (!state.modal) return '';
  const reset = state.modal === 'reset',
    reject = state.modal === 'reject';
  return `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><h2 id="modal-title">${reset ? 'Reset this demonstration?' : reject ? 'Why are you rejecting this request?' : 'Cancel this return request?'}</h2><p>${reset ? 'This removes this preview’s requests and history and restores the original 30-day policy. Your current customer or administrator view will stay selected.' : reject ? 'The customer will be able to see your explanation. The decision applies to every product in this request.' : 'The request will be closed and its units become available for a new return, provided the order is still eligible.'}</p>${reject ? '<label for="reject-reason">Rejection reason</label><textarea id="reject-reason" placeholder="Explain the decision…"></textarea><p class="modal-error" role="alert"></p>' : ''}<div class="actions">${btn(reset ? 'Keep my data' : reject ? 'Keep pending' : 'Keep request', 'dismiss-modal', 'secondary')}${btn(reset ? 'Confirm reset' : reject ? 'Confirm rejection' : 'Confirm cancellation', 'confirm-modal', 'danger')}</div></section></div>`;
}
function seedSelection() {
  if (!selectedItems().length) state.quantities = { [itemsFor(currentOrder())[0].id]: 1 };
  if (!state.reason.trim()) state.reason = 'The product does not fit my workspace as expected.';
}
function navigate(screen, { seed = false } = {}) {
  state.error = '';
  state.drawer = false;
  state.modal = null;
  if (['select', 'review', 'success', 'orders', 'returns'].includes(screen))
    state.role = 'customer';
  if (['admin', 'policy'].includes(screen)) state.role = 'admin';
  if (seed && ['review', 'success'].includes(screen)) seedSelection();
  state.screen = screen;
  render();
  window.scrollTo(0, 0);
  document.querySelector('#content')?.focus({ preventScroll: true });
}
function render() {
  const active = document.activeElement;
  const action = active?.dataset?.action;
  const activeId = active?.dataset?.id;
  document.body.dataset.concept = state.concept;
  document
    .querySelectorAll('button[data-concept]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.concept === state.concept)));
  const validScreen = [...document.querySelector('#screen-choice').options].some(
    (o) => o.value === state.screen,
  );
  document.querySelector('#screen-choice').value = validScreen ? state.screen : 'settings';
  const screens = {
    orders: ordersScreen,
    select: chooseProducts,
    review: reviewRequest,
    success,
    returns: returnsScreen,
    admin: adminScreen,
    settings: () => settingsScreen(),
    policy: () => settingsScreen(true),
  };
  app.innerHTML =
    (state.screen === 'home'
      ? home()
      : state.screen === 'comparison'
        ? comparison()
        : shell((screens[state.screen] || ordersScreen)())) +
    modal() +
    (state.toast
      ? `<div class="toast" role="status">${icon('check')}${escape(state.toast)}</div>`
      : '');
  document.querySelector('#content')?.setAttribute('tabindex', '-1');
  const url = new URL(location.href);
  url.searchParams.set('concept', state.concept);
  url.hash = state.screen;
  history.replaceState(null, '', url);
  applyOverlayIsolation();
  if (!document.querySelector('.modal,.drawer') && action) {
    [...document.querySelectorAll('[data-action]')]
      .find((el) => el.dataset.action === action && el.dataset.id === activeId)
      ?.focus({ preventScroll: true });
  }
}
function applyOverlayIsolation() {
  const overlay = document.querySelector('.modal') || document.querySelector('.drawer');
  if (overlay) {
    let branch = overlay;
    while (branch.parentElement && branch !== document.body) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) sibling.inert = true;
      }
      branch = branch.parentElement;
    }
    overlay.querySelector('button,textarea')?.focus({ preventScroll: true });
  } else {
    document.querySelectorAll('[inert]').forEach((el) => (el.inert = false));
  }
}
let toastTimeout;
function notify(text) {
  state.toast = text;
  render();
  clearTimeout(toastTimeout);
  document.querySelector('#announcer').textContent = text;
  toastTimeout = setTimeout(() => {
    state.toast = '';
    document.querySelector('.toast')?.remove();
  }, 3500);
}
function updateQuantity(id, next) {
  const activeAction = document.activeElement?.dataset?.action;
  const p = productData.find((p) => p.id === id);
  state.quantities[id] = Math.max(0, Math.min(p.max, next));
  const row = document.querySelector(`[data-product="${id}"]`);
  row.classList.toggle('selected', state.quantities[id] > 0);
  row.querySelector('.choice-slot').outerHTML = quantitySlot(p);
  if (activeAction) {
    const nextFocus =
      row.querySelector(`[data-action="${activeAction}"]:not(:disabled)`) ||
      row.querySelector('button:not(:disabled)');
    nextFocus?.focus({ preventScroll: true });
  }
  const selected = selectedItems();
  const summary = document.querySelector('.form-footer p strong');
  summary.textContent = selected.length
    ? `${selected.length} ${selected.length === 1 ? 'product' : 'products'} selected · ${selected.reduce((n, p) => n + p.quantity, 0)} units`
    : 'Choose at least one product';
  document.querySelector('#announcer').textContent =
    `${p.name}: ${state.quantities[id]} units selected.`;
}
function dispatch(action, el) {
  if (action === 'home') return navigate('home');
  if (action === 'comparison') return navigate('comparison');
  if (action === 'explore-concept') {
    state.concept = el.dataset.value;
    return navigate('home');
  }
  if (action === 'start') {
    state.detail = false;
    return navigate('orders');
  }
  if (action === 'start-admin') {
    state.requestDetail = false;
    return navigate('admin');
  }
  if (action.startsWith('role-')) {
    state.role = action.slice(5);
    state.requestDetail = false;
    state.detail = false;
    state.drawer = false;
    if (!['settings', 'policy'].includes(state.screen))
      state.screen = state.role === 'admin' ? 'admin' : 'orders';
    if (state.screen === 'policy' && state.role === 'customer') state.screen = 'settings';
    render();
    return;
  }
  if (action.startsWith('nav-')) {
    state.requestDetail = false;
    state.detail = false;
    return navigate(action.slice(4));
  }
  if (action === 'order') {
    state.order = el.dataset.id;
    state.detail = true;
    state.drawer = state.concept === 'c';
    render();
    if (state.concept === 'b') window.scrollTo(0, 0);
    return;
  }
  if (action === 'close-drawer') {
    state.drawer = false;
    render();
    return;
  }
  if (action === 'back-orders') {
    state.detail = false;
    return navigate('orders');
  }
  if (action === 'back-detail') {
    state.detail = true;
    navigate('orders');
    if (state.concept === 'c') {
      state.drawer = true;
      render();
    }
    return;
  }
  if (action === 'begin-return') {
    state.quantities = {};
    state.reason = '';
    return navigate('select');
  }
  if (['add', 'plus', 'minus'].includes(action)) {
    const id = el.dataset.id;
    return updateQuantity(id, (state.quantities[id] || 0) + (action === 'minus' ? -1 : 1));
  }
  if (action === 'select-all') {
    itemsFor(currentOrder()).forEach((p) => updateQuantity(p.id, p.max));
    return;
  }
  if (action === 'review') {
    if (!selectedItems().length) state.error = 'Choose at least one product to return.';
    else if (!state.reason.trim())
      state.error = 'Please tell us why you’d like to return these products.';
    else if (Array.from(state.reason.trim()).length > 1000)
      state.error = 'Use 1,000 characters or fewer for your return reason.';
    else return navigate('review');
    render();
    document.querySelector('#return-reason')?.focus();
    return;
  }
  if (action === 'edit-selection') return navigate('select');
  if (action === 'create') {
    if (!selectedItems().length) return navigate('select');
    const r = {
      id: 'RET-' + (285 + state.requests.filter((r) => r.new).length),
      new: true,
      order: state.order,
      customer: state.customer,
      status: 'PENDING',
      date: 'Oct 21, just now',
      reason: state.reason,
      items: selectedItems().map((p) => ({ id: p.id, quantity: p.quantity })),
      events: [['Request created', state.customer + ' · Customer', 'Just now']],
    };
    state.requests.unshift(r);
    state.created = r;
    state.request = r.id;
    return navigate('success');
  }
  if (action === 'view-created') {
    state.request = (state.created || state.requests[0]).id;
    state.requestDetail = true;
    return navigate('returns');
  }
  if (action === 'open-request') {
    state.request = el.dataset.id;
    state.requestDetail = true;
    state.drawer = state.concept === 'c' && state.role === 'admin';
    render();
    if (state.concept === 'b' || state.role === 'customer') window.scrollTo(0, 0);
    return;
  }
  if (action === 'back-requests') {
    state.requestDetail = false;
    state.drawer = false;
    render();
    return;
  }
  if (action === 'filter') {
    state.filter = el.dataset.value;
    if (state.concept === 'a')
      state.request = state.requests.find(
        (r) => state.filter === 'ALL' || r.status === state.filter,
      )?.id;
    state.requestDetail = false;
    state.drawer = false;
    render();
    return;
  }
  if (action === 'refresh') return notify('You’re up to date. Your current view has been kept.');
  if (action === 'approve' || action === 'receive') {
    const r = state.requests.find((r) => r.id === state.request);
    if (!r) return;
    if (
      (action === 'approve' && r.status !== 'PENDING') ||
      (action === 'receive' && r.status !== 'APPROVED')
    )
      return;
    r.status = action === 'approve' ? 'APPROVED' : 'RECEIVED';
    r.events.push([
      action === 'approve' ? 'Request approved' : 'Simulated receipt confirmed',
      'Administrator',
      'Just now',
    ]);
    return notify(
      action === 'approve'
        ? 'Request approved. Customer instructions are ready.'
        : 'Simulated receipt recorded. No monetary refund was issued.',
    );
  }
  if (['reset', 'reject', 'cancel'].includes(action)) {
    state.modal = action;
    render();
    return;
  }
  if (action === 'dismiss-modal') {
    state.modal = null;
    render();
    return;
  }
  if (action === 'confirm-modal') {
    const type = state.modal;
    if (type === 'reset') {
      state.requests = sampleRequests();
      state.windowDays = 30;
      state.created = null;
      state.request = 'RET-0284';
      state.modal = null;
      return notify('Sample data restored. Your current view has been kept.');
    }
    const r = state.requests.find((r) => r.id === state.request);
    if (!r || r.status !== 'PENDING') return;
    const reason = document.querySelector('#reject-reason')?.value.trim();
    if (type === 'reject' && !reason) {
      document.querySelector('.modal-error').textContent = 'Enter a rejection reason to continue.';
      document.querySelector('#reject-reason').focus();
      return;
    }
    r.status = type === 'reject' ? 'REJECTED' : 'CANCELLED';
    r.rejection = reason;
    r.events.push([
      type === 'reject' ? 'Request rejected' : 'Request cancelled',
      type === 'reject' ? 'Administrator' : state.customer + ' · Customer',
      'Just now',
    ]);
    state.modal = null;
    return notify(
      type === 'reject'
        ? 'Request rejected. The reason is visible to the customer.'
        : 'Request cancelled.',
    );
  }
  if (action === 'save-policy') {
    const n = Number(document.querySelector('#window-days').value);
    if (!Number.isInteger(n) || n <= 0 || n > 3650)
      return notify('Use a whole number between 1 and 3,650 days.');
    state.windowDays = n;
    return notify(`Return window updated to ${n} calendar days for new requests.`);
  }
}
document.addEventListener('pointerdown', () => {
  document.body.dataset.input = 'pointer';
});
document.addEventListener('click', (e) => {
  const concept = e.target.closest('button[data-concept]');
  if (concept) {
    state.concept = concept.dataset.concept;
    state.drawer = false;
    render();
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  e.preventDefault();
  dispatch(el.dataset.action, el);
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'return-reason') state.reason = e.target.value;
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'screen-choice') {
    state.requestDetail = false;
    state.detail = false;
    return navigate(e.target.value, { seed: true });
  }
  if (e.target.id === 'customer-choice') {
    state.customer = e.target.value;
    state.requestDetail = false;
    state.detail = false;
    navigate('orders');
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'return-form') {
    e.preventDefault();
    dispatch('review', e.target);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') document.body.dataset.input = 'keyboard';
  const overlay = document.querySelector('.modal') || document.querySelector('.drawer');
  if (e.key === 'Escape' && overlay) {
    state.modal = null;
    state.drawer = false;
    render();
    return;
  }
  if (e.key === 'Tab' && overlay) {
    const focusable = [
      ...overlay.querySelectorAll('button:not(:disabled),a,textarea,input,select,[tabindex="0"]'),
    ];
    const first = focusable[0],
      last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
const initial = location.hash.slice(1);
if (
  [
    'orders',
    'select',
    'review',
    'success',
    'returns',
    'admin',
    'settings',
    'policy',
    'comparison',
  ].includes(initial)
) {
  state.screen = initial;
  if (['admin', 'policy'].includes(initial)) state.role = 'admin';
  if (['review', 'success'].includes(initial)) seedSelection();
}
render();
window.addEventListener('hashchange', () => {
  const screen = location.hash.slice(1);
  if (
    [
      'home',
      'orders',
      'select',
      'review',
      'success',
      'returns',
      'admin',
      'settings',
      'policy',
      'comparison',
    ].includes(screen) &&
    screen !== state.screen
  ) {
    navigate(screen, { seed: true });
  }
});
