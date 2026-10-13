'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, FileText, ShieldCheck, XCircle, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VERIFICATION_METHOD_LABELS, type VerificationMethod } from '@/types/database';

interface CertRequest {
  id: string;
  credential_id: string | null;
  license_number: string | null;
  issuing_state: string | null;
  expiry_date: string | null;
  document_path: string | null;
  status: string;
  certification: { name: string; issuing_body: string; verification_url: string | null; default_method: VerificationMethod | null };
  tradesperson: { profile: { first_name: string; last_name: string } };
}

const METHOD_OPTIONS = [
  { value: '', label: 'Select method' },
  ...Object.entries(VERIFICATION_METHOD_LABELS).map(([value, label]) => ({ value, label })),
];

export default function AdminCertificationsPage() {
  const [certs, setCerts] = useState<CertRequest[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<'verify' | 'reject' | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoBusyId, setAutoBusyId] = useState<string | null>(null);

  // form state for the active review
  const [method, setMethod] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from('tradesperson_certifications')
      .select('*, certification:certifications(name, issuing_body, verification_url, default_method), tradesperson:tradesperson_profiles(profile:profiles(first_name, last_name))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setCerts(data ?? []);
  }

  function startReview(cert: CertRequest, m: 'verify' | 'reject') {
    setActiveId(cert.id);
    setMode(m);
    setMethod(cert.certification?.default_method ?? '');
    setSourceUrl(cert.certification?.verification_url ?? '');
    setReference('');
    setNotes('');
    setRejectReason('');
  }

  function cancelReview() {
    setActiveId(null);
    setMode(null);
  }

  async function runAutoVerify(certId: string) {
    setAutoBusyId(certId);
    try {
      const res = await fetch('/api/certifications/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certification_id: certId }),
      });
      const data = await res.json();
      if (res.ok && (data.outcome === 'verified' || data.outcome === 'rejected')) {
        setCerts((prev) => prev.filter((c) => c.id !== certId));
        if (activeId === certId) cancelReview();
      } else if (res.ok) {
        await load();
      }
    } finally {
      setAutoBusyId(null);
    }
  }

  async function viewDocument(path: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('certifications').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function submitVerify(cert: CertRequest) {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('tradesperson_certifications').update({
      status: 'verified',
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
      verification_method: method || null,
      verification_source_url: sourceUrl || null,
      verification_reference: reference || null,
      verification_notes: notes || null,
      rejection_reason: null,
    }).eq('id', cert.id);

    await supabase.from('certification_verification_events').insert({
      tradesperson_certification_id: cert.id,
      actor_id: user?.id,
      action: 'verified',
      method: method || null,
      source_url: sourceUrl || null,
      reference: reference || null,
      notes: notes || null,
    });

    setCerts((prev) => prev.filter((c) => c.id !== cert.id));
    cancelReview();
    setBusy(false);
  }

  async function submitReject(cert: CertRequest) {
    setBusy(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('tradesperson_certifications').update({
      status: 'rejected',
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
      rejection_reason: rejectReason || 'Could not verify against official source.',
    }).eq('id', cert.id);

    await supabase.from('certification_verification_events').insert({
      tradesperson_certification_id: cert.id,
      actor_id: user?.id,
      action: 'rejected',
      notes: rejectReason || null,
    });

    setCerts((prev) => prev.filter((c) => c.id !== cert.id));
    cancelReview();
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certification Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Confirm each credential against its official source before approving. Every decision is recorded in an audit trail.
        </p>
      </div>

      <div className="space-y-3">
        {certs.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold">{cert.certification?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {cert.tradesperson?.profile?.first_name} {cert.tradesperson?.profile?.last_name} • {cert.certification?.issuing_body}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {cert.license_number && <span>Lic# <strong className="text-gray-700 dark:text-gray-300">{cert.license_number}</strong></span>}
                    {cert.issuing_state && <span>State: <strong className="text-gray-700 dark:text-gray-300">{cert.issuing_state}</strong></span>}
                    {cert.credential_id && <span>Ref: {cert.credential_id}</span>}
                    {cert.expiry_date && <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={autoBusyId === cert.id}
                      onClick={() => runAutoVerify(cert.id)}
                    >
                      <Zap className="h-4 w-4" />
                      {autoBusyId === cert.id ? 'Checking…' : 'Run auto-verify'}
                    </Button>
                    {cert.document_path && (
                      <Button size="sm" variant="outline" onClick={() => viewDocument(cert.document_path!)}>
                        <FileText className="h-4 w-4" /> View document
                      </Button>
                    )}
                    {cert.certification?.verification_url && (
                      <a href={cert.certification.verification_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" /> Open official lookup
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
                {activeId !== cert.id && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => startReview(cert, 'verify')}><ShieldCheck className="h-4 w-4" /> Verify</Button>
                    <Button size="sm" variant="destructive" onClick={() => startReview(cert, 'reject')}><XCircle className="h-4 w-4" /> Reject</Button>
                  </div>
                )}
              </div>

              {/* Verify form */}
              {activeId === cert.id && mode === 'verify' && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Record how you confirmed this credential</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select label="Verification method" options={METHOD_OPTIONS} value={method} onChange={(e) => setMethod(e.target.value)} />
                    <Input label="Reference / confirmation #" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. board confirmation #" />
                  </div>
                  <Input label="Source URL (proof)" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Link to the official lookup result" />
                  <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" disabled={busy || !method} onClick={() => submitVerify(cert)}>
                      {busy ? 'Saving…' : 'Confirm verification'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelReview}>Cancel</Button>
                  </div>
                  {!method && <p className="text-xs text-amber-600">Select a verification method to continue.</p>}
                </div>
              )}

              {/* Reject form */}
              {activeId === cert.id && mode === 'reject' && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Reason for rejection</p>
                  <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="e.g. License number not found on state board; document illegible." />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={busy} onClick={() => submitReject(cert)}>
                      {busy ? 'Saving…' : 'Confirm rejection'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelReview}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {certs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No pending certifications.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
