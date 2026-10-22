type Variant =
  | 'orders'
  | 'order-detail'
  | 'admin'
  | 'admin-detail'
  | 'returns'
  | 'return-detail'
  | 'return-form'
  | 'policy'
  | 'settings'
  | 'workspace';
const labels: Record<Variant, string> = {
  orders: 'Loading orders',
  'order-detail': 'Loading order details',
  admin: 'Loading return requests',
  'admin-detail': 'Loading request details',
  returns: 'Loading your returns',
  'return-detail': 'Loading return details',
  'return-form': 'Loading return products',
  policy: 'Loading return policy',
  settings: 'Loading demo settings',
  workspace: 'Loading workspace',
};
function Block({ className = '' }: { className?: string }) {
  return <div className={'skeleton-block ' + className} />;
}
function Heading() {
  return (
    <div className="page-heading skeleton-heading">
      <div>
        <Block className="sk-title" />
        <Block className="sk-subtitle" />
      </div>
      <Block className="sk-button" />
    </div>
  );
}
function Rows({ selection = false, count = 3 }: { selection?: boolean; count?: number }) {
  return (
    <div className={selection ? 'selection-list' : 'products'}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={selection ? 'selection-product' : 'product-row'}>
          <Block className="sk-image" />
          <div className="sk-product-copy">
            <Block className="sk-name" />
            <Block className="sk-line sk-medium" />
            <Block className="sk-line sk-short" />
          </div>
          {selection ? (
            <div className="choice-slot">
              <Block className="sk-button" />
              <Block className="sk-caption" />
            </div>
          ) : (
            <Block className="sk-price" />
          )}
        </div>
      ))}
    </div>
  );
}
function Detail({ request = false }: { request?: boolean }) {
  return (
    <section className={'sheet ' + (request ? 'request-detail' : 'order-detail')}>
      <header className="detail-header">
        <div className="detail-title">
          <Block className="sk-detail-title" />
          <Block className="sk-badge" />
        </div>
        <div className="detail-meta">
          {[0, 1].map((i) => (
            <div key={i} className="sk-meta">
              <Block className="sk-caption" />
              <Block className="sk-line" />
            </div>
          ))}
        </div>
        {request && <Block className="sk-line sk-medium sk-space" />}
      </header>
      <Rows count={request ? 1 : 3} />
      {request ? (
        <>
          <div className="reason-summary sk-reason">
            <Block className="sk-caption" />
            <Block className="sk-line" />
            <Block className="sk-line sk-medium" />
          </div>
          <div className="decision-bar">
            <Block className="sk-button" />
            <Block className="sk-button" />
          </div>
          <div className="request-body">
            <Block className="sk-line" />
            <div className="sk-history">
              <Block className="sk-name" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="sk-history-row">
                  <Block className="sk-dot" />
                  <div>
                    <Block className="sk-line" />
                    <Block className="sk-caption" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="order-total">
            <Block className="sk-line sk-medium" />
            <Block className="sk-price" />
          </div>
          <footer className="order-options">
            <div>
              <Block className="sk-caption" />
              <Block className="sk-line sk-space" />
            </div>
            <Block className="sk-button" />
          </footer>
        </>
      )}
    </section>
  );
}
function Navigator({ admin = false }: { admin?: boolean }) {
  return (
    <aside className={'list-panel ' + (admin ? 'request-queue' : 'order-browser')}>
      {Array.from({ length: admin ? 6 : 4 }, (_, i) => (
        <div key={i} className={admin ? 'queue-item' : 'order-option'}>
          <Block className="sk-name" />
          <Block className="sk-line" />
          {admin ? (
            <Block className="sk-badge" />
          ) : (
            <div className="order-option-bottom">
              <div className="order-thumbs">
                <Block className="sk-thumb" />
                <Block className="sk-thumb" />
              </div>
              <Block className="sk-badge" />
            </div>
          )}
        </div>
      ))}
    </aside>
  );
}
function Settings() {
  return (
    <div className="settings-wrap">
      <Heading />
      <Block className="sk-context" />
      <div className="sheet settings-panel">
        {[0, 1, 2].map((i) => (
          <section className="setting-section" key={i}>
            <Block className="setting-icon" />
            <div>
              <Block className="sk-name" />
              <div className="sk-paragraph">
                <Block className="sk-line" />
                <Block className="sk-line" />
                <Block className="sk-line sk-medium" />
              </div>
              {i === 2 && <Block className="sk-button sk-space" />}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
function Content({ variant }: { variant: Variant }) {
  if (variant === 'order-detail') return <Detail />;
  if (variant === 'admin-detail') return <Detail request />;
  if (variant === 'settings') return <Settings />;
  if (variant === 'policy')
    return (
      <>
        <Heading />
        <div className="sheet measure sk-policy">
          <Block className="sk-detail-title" />
          <div className="sk-paragraph">
            <Block className="sk-line" />
            <Block className="sk-line" />
          </div>
          <div className="form-field">
            <Block className="sk-name" />
            <Block className="sk-input sk-space" />
            <div className="sk-paragraph">
              <Block className="sk-line" />
              <Block className="sk-line sk-medium" />
            </div>
          </div>
          <Block className="sk-button" />
        </div>
      </>
    );
  if (variant === 'return-form')
    return (
      <div className="center-flow">
        <Block className="sk-back" />
        <div className="steps sk-steps">
          {[0, 1, 2].map((i) => (
            <Block className="sk-step" key={i} />
          ))}
        </div>
        <div className="flow-heading">
          <Block className="sk-title" />
          <Block className="sk-subtitle" />
        </div>
        <div className="sheet selection-form">
          <header className="form-top">
            <div>
              <Block className="sk-name" />
              <Block className="sk-line sk-space" />
            </div>
            <Block className="sk-price" />
          </header>
          <Rows selection />
          <div className="form-reason">
            <Block className="sk-name" />
            <Block className="sk-textarea" />
            <Block className="sk-line" />
          </div>
          <footer className="form-footer">
            <div>
              <Block className="sk-name" />
              <Block className="sk-line sk-space" />
            </div>
            <Block className="sk-button" />
          </footer>
        </div>
      </div>
    );
  if (variant === 'return-detail')
    return (
      <div className="center-flow">
        <Heading />
        <Block className="sk-back" />
        <div className="sheet measure sk-customer-detail">
          <div className="detail-title">
            <Block className="sk-detail-title" />
            <Block className="sk-badge" />
          </div>
          <Block className="sk-line sk-medium" />
          <Rows count={1} />
          <div className="sk-paragraph">
            <Block className="sk-name" />
            <Block className="sk-line" />
          </div>
          <Block className="sk-button sk-space" />
          <div className="sk-history">
            <Block className="sk-name" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="sk-history-row">
                <Block className="sk-dot" />
                <div>
                  <Block className="sk-line" />
                  <Block className="sk-caption" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (variant === 'returns')
    return (
      <>
        <Heading />
        <div className="list-panel">
          {[0, 1, 2, 3].map((i) => (
            <div className="list-row sk-return-row" key={i}>
              <div>
                <Block className="sk-name" />
                <Block className="sk-line sk-space" />
              </div>
              <Block className="sk-badge" />
            </div>
          ))}
        </div>
      </>
    );
  return (
    <>
      <Heading />
      {variant === 'admin' && (
        <div className="filters sk-filters">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Block className="sk-filter" key={i} />
          ))}
        </div>
      )}
      <div className="master-detail">
        <Navigator admin={variant === 'admin'} />
        <div>
          <Detail request={variant === 'admin'} />
          {variant !== 'admin' && <Block className="sk-line sk-space" />}
        </div>
      </div>
    </>
  );
}
export function SectionSkeleton({ variant = 'workspace' }: { variant?: Variant }) {
  return (
    <div
      className={'section-skeleton skeleton-' + variant}
      role="status"
      aria-label={labels[variant]}
      aria-busy="true"
    >
      <span className="sr-only">{labels[variant]}…</span>
      <div aria-hidden="true">
        <Content variant={variant} />
      </div>
    </div>
  );
}
