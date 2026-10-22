import Link from 'next/link';
export function Brand() {
  return (
    <Link className="brand" href="/" prefetch={false}>
      <span className="brand-mark">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="m8 9 8-4 8 4v10l-8 4-8-4V9Zm0 0 8 4 8-4M16 13v5M26 23a7 7 0 0 1-11 5m0 0v-5m0 5h5" />
        </svg>
      </span>
      <span className="brand-text">
        <span className="brand-title">
          Order Returns Manager<span className="demo-label">Demo</span>
        </span>
        <small>Orders, returns and clear next steps.</small>
      </span>
    </Link>
  );
}
