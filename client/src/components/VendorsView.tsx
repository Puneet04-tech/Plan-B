"use strict";

import type { PlanBundle, VendorStatus } from '@shared/types';
import { useVendorChecklist } from '../lib/vendorStorage';
import VendorAI from './VendorAI';

const STATUS_OPTIONS: Array<{ value: VendorStatus; label: string }> = [
  { value: 'to-contact', label: 'To contact' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'booked', label: 'Booked' },
];

interface Props {
  plan: PlanBundle;
}

const formatINR = (n: number): string => `₹${Math.round(n).toLocaleString('en-IN')}`;

const VendorsView = ({ plan }: Props) => {
  const { items, update, storageAvailable } = useVendorChecklist(plan.vendors);

  const booked = items.filter((i) => i.status === 'booked').length;

  return (
    <div className="card">
      <h2>Vendor checklist</h2>
      {!storageAvailable && (
        <p className="chip chip-warn" role="status" style={{ display: 'inline-block', margin: '0.5rem 0' }}>
          Storage unavailable — changes last for this session only
        </p>
      )}
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 1rem' }}>
        {booked} of {items.length} booked
      </p>

      <div className="table-scroll">
      <table>
        <caption>Questions to ask, documents to collect, and booking status for each vendor.</caption>
        <thead>
          <tr>
            <th scope="col" className="col-checkbox">Booked</th>
            <th scope="col">Vendor</th>
            <th scope="col" className="col-status">Status</th>
            <th scope="col" className="col-cost">Est. cost</th>
            <th scope="col">Key questions</th>
            <th scope="col">Documents</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="col-checkbox">
                <input
                  type="checkbox"
                  checked={item.contacted}
                  onChange={(e) => update(item.id, { contacted: e.target.checked })}
                  aria-label={`Contacted ${item.category}`}
                  style={{ width: 20, height: 20 }}
                />
              </td>
              <td>
                <strong>{item.category}</strong>
                {item.needsBackup && (
                  <>
                    {' '}
                    <span className="chip chip-alert">backup needed</span>
                  </>
                )}
                {item.complianceNote && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    ⚖ {item.complianceNote}
                  </div>
                )}
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                  Advance: {item.advancePaymentGuidance} · Confirm by {item.confirmLeadDays} days before event
                </div>
              </td>
              <td className="col-status">
                <select
                  value={item.status}
                  onChange={(e) => update(item.id, { status: e.target.value as VendorStatus })}
                  aria-label={`Status for ${item.category}`}
                  style={{ minHeight: 44, padding: '0.3rem', border: '1.5px solid var(--rule)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink)' }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td className="col-cost">{formatINR(item.estimatedCost)}</td>
              <td>
                <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                  {item.questions.slice(0, 2).map((q) => <li key={q}>{q}</li>)}
                </ul>
              </td>
              <td>
                <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                  {item.documents.slice(0, 2).map((d) => <li key={d}>{d}</li>)}
                </ul>
              </td>
              <td>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => update(item.id, { notes: e.target.value })}
                  aria-label={`Contact notes for ${item.category}`}
                  placeholder="Phone, quotes…"
                  style={{ width: 130, minHeight: 44, padding: '0.4rem', border: '1.5px solid var(--rule)', borderRadius: 6, background: 'var(--surface)', color: 'var(--ink)' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* @ts-ignore - VendorAI expects Record<string, unknown> for planData */}
      <VendorAI planData={plan as unknown as Record<string, unknown>} />
    </div>
  );
};

export default VendorsView;
