'use client';
import { AsyncButton } from './async-button';
import { notify } from './toast';
import { SectionSkeleton } from './section-skeleton';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDemoData, ErrorNotice } from './demo-context';
import { useDemoMutation } from './use-demo-mutation';
import { Icon } from './icon';
import { ProductRow } from './order-sheet';
import { money } from '@/lib/money';
import type { OrderView } from '@/lib/contracts';
export function ReturnForm() {
  const { customerId, orderId } = useParams<{ customerId: string; orderId: string }>();
  const order = useDemoData<OrderView>(`/api/customers/${customerId}/orders/${orderId}`),
    mutation = useDemoMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>({}),
    [reason, setReason] = useState(''),
    [review, setReview] = useState(false),
    [validation, setValidation] = useState(''),
    [result, setResult] = useState<{ id: string; displayNumber: string }>();
  const heading = useRef<HTMLHeadingElement>(null),
    reasonInput = useRef<HTMLTextAreaElement>(null);
  if (order.error) return <ErrorNotice error={order.error} retry={order.refresh} />;
  if (!order.data) return <SectionSkeleton variant="return-form" />;
  const data = order.data,
    items = data.items
      .filter((i) => (quantities[i.orderItemId] ?? 0) > 0)
      .map((i) => ({ orderItemId: i.orderItemId, quantity: quantities[i.orderItemId] }));
  const step = result ? 2 : review ? 1 : 0;
  const steps = (
    <nav className="steps" aria-label="Return request progress">
      {['Choose products', 'Review request', 'Confirmation'].map((label, i) => (
        <span
          key={label}
          className={'step ' + (step === i ? 'active' : '')}
          aria-current={step === i ? 'step' : undefined}
        >
          <span>{i < step ? <Icon name="check" /> : i + 1}</span>
          {label}
        </span>
      ))}
    </nav>
  );
  const changeStep = (next: boolean) => {
    setReview(next);
    requestAnimationFrame(() => heading.current?.focus());
  };
  if (result)
    return (
      <div className="center-flow">
        {steps}
        <section className="success-card">
          <div className="success-icon">
            <Icon name="check" />
          </div>
          <div className="success-meta">
            <strong>{result.displayNumber}</strong>
            <span className="badge PENDING">Pending review</span>
          </div>
          <h1>Return request created</h1>
          <p>
            Your request for order {data.displayNumber} is saved. Follow its progress in My returns.
          </p>
          <div className="next-step">
            <h2>What happens next?</h2>
            <p>
              An administrator reviews the full request. You’ll find the decision and any
              instructions in the request details. While it’s pending, you can still cancel it.
            </p>
          </div>
          <div className="success-actions">
            <Link
              className="button"
              prefetch={false}
              href={`/customer/${customerId}/returns/${result.id}`}
            >
              View request
            </Link>
            <Link
              className="button secondary"
              href={`/customer/${customerId}/orders?order=${orderId}`}
              prefetch={false}
            >
              Back to orders
            </Link>
          </div>
        </section>
      </div>
    );
  const submit = async () => {
    const r = await mutation.run<{ id: string; displayNumber: string }>(
      `/api/customers/${customerId}/orders/${orderId}/returns`,
      { reason, items },
      order.generation,
    );
    if (r) {
      notify('success', 'Return request created.');
      setResult(r);
    }
  };
  return (
    <div className="center-flow">
      <Link
        className="back-link"
        href={`/customer/${customerId}/orders?order=${orderId}`}
        prefetch={false}
      >
        <Icon name="left" />
        Back to order
      </Link>
      {steps}
      <div className="flow-heading">
        <h1 ref={heading} tabIndex={-1}>
          {review ? 'Review your request' : 'What would you like to return?'}
        </h1>
        <p>
          Order {data.displayNumber}.{' '}
          {review
            ? 'Check the products, quantities and reason before creating your request.'
            : 'Choose the products and quantities that work for you.'}
        </p>
      </div>
      {!data.eligibility.eligible ? (
        <div className="alert error">{data.eligibility.message}</div>
      ) : review ? (
        <div className="review-layout">
          <section className="sheet">
            <h2 className="section-title">Your return selection</h2>
            <div className="products">
              {items.map((l) => (
                <ProductRow
                  key={l.orderItemId}
                  item={{
                    ...data.items.find((i) => i.orderItemId === l.orderItemId)!,
                    requestedQuantity: l.quantity,
                  }}
                />
              ))}
            </div>
            <div className="reason-summary">
              <h3>Return reason</h3>
              <p>{reason}</p>
            </div>
          </section>
          <aside className="review-aside">
            <h2>Request summary</h2>
            <dl>
              <div>
                <dt>Order</dt>
                <dd>{data.displayNumber}</dd>
              </div>
              <div>
                <dt>Products</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Units</dt>
                <dd>{items.reduce((n, l) => n + l.quantity, 0)}</dd>
              </div>
            </dl>
            <p>An administrator will review your request.</p>
            <AsyncButton busy={mutation.busy} busyLabel="Creating request…" onClick={submit}>
              Create request
            </AsyncButton>
            <button
              className="secondary"
              disabled={mutation.busy}
              onClick={() => changeStep(false)}
            >
              Edit selection
            </button>
          </aside>
        </div>
      ) : (
        <form
          className="sheet selection-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!items.length || !reason.trim() || Array.from(reason.trim()).length > 1000) {
              setValidation('Select at least one product and enter a reason of 1–1000 characters.');
              reasonInput.current?.focus();
              return;
            }
            setValidation('');
            changeStep(true);
          }}
        >
          <header className="form-top">
            <div>
              <h2>Products in this order</h2>
              <p>Add products below, then tell us why.</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setQuantities(
                  Object.fromEntries(
                    data.items
                      .filter((i) => i.availableQuantity > 0)
                      .map((i) => [i.orderItemId, i.availableQuantity]),
                  ),
                )
              }
            >
              Select all available units
            </button>
          </header>
          <div className="selection-list">
            {data.items.map((i) => {
              const quantity = quantities[i.orderItemId] ?? 0;
              return (
                <div
                  className={'selection-product ' + (quantity ? 'selected' : '')}
                  key={i.orderItemId}
                >
                  <Image
                    src={i.imagePath}
                    alt={`${i.name} product illustration`}
                    width={76}
                    height={76}
                  />
                  <div>
                    <h3>{i.name}</h3>
                    <p>
                      {money(i.purchasePriceMinor)} each · {i.purchasedQuantity} purchased
                    </p>
                    {i.committedQuantity > 0 && (
                      <p className="availability-note">
                        {i.committedQuantity} unit(s) already in a return
                      </p>
                    )}
                  </div>
                  <div className="choice-slot">
                    {quantity ? (
                      <div
                        className="quantity-control"
                        role="group"
                        aria-label={`Return quantity for ${i.name}`}
                      >
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Decrease quantity for ${i.name}`}
                          onClick={() =>
                            setQuantities((q) => ({ ...q, [i.orderItemId]: quantity - 1 }))
                          }
                        >
                          <Icon name={quantity === 1 ? 'close' : 'minus'} />
                        </button>
                        <output aria-label="Selected quantity">{quantity}</output>
                        <button
                          type="button"
                          className="icon-button"
                          disabled={quantity >= i.availableQuantity}
                          aria-label={`Increase quantity for ${i.name}`}
                          onClick={() =>
                            setQuantities((q) => ({ ...q, [i.orderItemId]: quantity + 1 }))
                          }
                        >
                          <Icon name="plus" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="add-product secondary"
                        type="button"
                        disabled={!i.availableQuantity}
                        aria-label={`Add ${i.name} to return`}
                        onClick={() => setQuantities((q) => ({ ...q, [i.orderItemId]: 1 }))}
                      >
                        <Icon name="plus" />
                        {i.availableQuantity ? 'Add to return' : 'Unavailable'}
                      </button>
                    )}
                    <small>
                      {quantity ? `${quantity} of ` : ''}
                      {i.availableQuantity} unit(s) returnable
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="form-reason">
            <label htmlFor="reason">Return reason</label>
            <textarea
              ref={reasonInput}
              id="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-describedby="reason-help"
              aria-invalid={!!validation}
            />
            <p id="reason-help">
              One reason for your selection. Use 1–1000 characters. Please leave out real personal
              information.
            </p>
            {validation && (
              <p className="alert error" role="alert">
                {validation}
              </p>
            )}
          </div>
          <footer className="form-footer">
            <p>
              <strong>
                {items.length
                  ? `${items.length} product(s) selected`
                  : 'Choose at least one product'}
              </strong>
              You’ll review everything before creating the request.
            </p>
            <button>
              Review request
              <Icon name="arrow" />
            </button>
          </footer>
        </form>
      )}
    </div>
  );
}
