'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, ShieldCheck, Clock, XCircle, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { US_STATES } from '@/lib/constants';
import {
  VERIFICATION_METHOD_LABELS,
  type Certification,
  type TradespersonCertification,
} from '@/types/database';

export default function CertificationsPage() {
  const [certs, setCerts] = useState<(TradespersonCertification & { certification: Certification })[]>([]);
  const [available, setAvailable] = useState<Certification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tradespersonId, setTradespersonId] = useState('');
  const [selectedCertId, setSelectedCertId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tp } = await supabase.from('tradesperson_profiles').select('id').eq('user_id', user.id).single();
      if (!tp) return;
      setTradespersonId(tp.id);

      const { data: myCerts } = await supabase
        .from('tradesperson_certifications')
        .select('*, certification:certifications(*)')
        .eq('tradesperson_id', tp.id);
      setCerts(myCerts ?? []);

      const { data: allCerts } = await supabase.from('certifications').select('*').order('name');
      setAvailable(allCerts ?? []);
    }
    load();
  }, []);

  const selectedCert = useMemo(
    () => available.find((c) => c.id === selectedCertId),
    [available, selectedCertId]
  );

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    let docPath: string | null = null;
    const docFile = form.get('document') as File;
    if (docFile?.size > 0) {
      const path = `${user.id}/${Date.now()}-cert.${docFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('certifications').upload(path, docFile);
      if (!uploadError) docPath = path;
    }

    const { data } = await supabase.from('tradesperson_certifications').insert({
      tradesperson_id: tradespersonId,
      certification_id: form.get('certification_id') as string,
      credential_id: (form.get('credential_id') as string) || null,
      license_number: (form.get('license_number') as string) || null,
      issuing_state: (form.get('issuing_state') as string) || null,
      issue_date: (form.get('issue_date') as string) || null,
      expiry_date: (form.get('expiry_date') as string) || null,
      document_path: docPath,
    }).select('*, certification:certifications(*)').single();

    if (data) {
      setCerts((prev) => [...prev, data]);
      // Run automated verification immediately (Texas licenses verify instantly; others queue for review).
      try {
        const verifyRes = await fetch('/api/certifications/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ certification_id: data.id }),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.certification) {
            setCerts((prev) => prev.map((c) => (c.id === data.id ? verifyData.certification : c)));
          }
        }
      } catch {
        // Auto-verify is best-effort; cert stays pending for manual review.
      }
    }
    setShowForm(false);
    setSelectedCertId('');
    setSubmitting(false);
  }

  const statusVariant = (s: string) => {
    if (s === 'verified') return 'verified' as const;
    if (s === 'pending') return 'warning' as const;
    return 'destructive' as const;
  };

  const statusIcon = (s: string) => {
    if (s === 'verified') return <ShieldCheck className="h-4 w-4" />;
    if (s === 'pending') return <Clock className="h-4 w-4" />;
    if (s === 'expired') return <AlertTriangle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certifications</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Add Certification</Button>
      </div>

      {/* How verification works */}
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-gray-900 dark:text-white">How verification works</p>
            <p className="mt-1">
              Adding a credential doesn&apos;t make it &ldquo;verified.&rdquo; Our team checks each one against the
              official source — your <strong>state licensing board</strong> or the <strong>issuing body</strong> (EPA, NATE, AWS, ASE) —
              using your license/credential number. Once confirmed, your profile shows a verified badge
              <em> along with how and where it was checked</em>, so employers can trust it&apos;s real.
            </p>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Certification</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <Select
                id="certification_id"
                name="certification_id"
                label="Certification"
                required
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
                options={[{ value: '', label: 'Select certification' }, ...available.map((c) => ({ value: c.id, label: `${c.name} (${c.issuing_body})` }))]}
              />

              {selectedCert && (
                <div className="rounded-md bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    We&apos;ll verify this via{' '}
                    <strong>{selectedCert.default_method ? VERIFICATION_METHOD_LABELS[selectedCert.default_method] : 'document review'}</strong>.
                    {selectedCert.requires_license && ' A license/credential number is required.'}
                  </p>
                  {selectedCert.verification_url && (
                    <a href={selectedCert.verification_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-1">
                      Official verification source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="license_number"
                  name="license_number"
                  label="License / Credential Number"
                  placeholder="e.g. EC13001234"
                  required={!!selectedCert?.requires_license}
                />
                <Select
                  id="issuing_state"
                  name="issuing_state"
                  label="Issuing State"
                  options={[{ value: '', label: 'Select state' }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
                />
              </div>

              <Input id="credential_id" name="credential_id" label="Additional Reference ID (optional)" />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="issue_date" name="issue_date" label="Issue Date" type="date" />
                <Input id="expiry_date" name="expiry_date" label="Expiry Date" type="date" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Upload Official Document</label>
                <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" />
                <p className="text-xs text-gray-400 mt-1">Upload your license card or certificate. Stored privately and only seen by our verification team.</p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for Verification'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {certs.map((cert) => (
          <Card key={cert.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cert.certification?.name}</h3>
                  <p className="text-sm text-gray-500">
                    {cert.certification?.issuing_body}
                    {cert.license_number && ` • Lic# ${cert.license_number}`}
                    {cert.issuing_state && ` • ${cert.issuing_state}`}
                  </p>
                </div>
                <Badge variant={statusVariant(cert.status)} className="flex items-center gap-1 shrink-0">
                  {statusIcon(cert.status)} {cert.status}
                </Badge>
              </div>

              {/* Verified provenance */}
              {cert.status === 'verified' && (
                <div className="mt-3 rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm">
                  <p className="text-green-800 dark:text-green-300 font-medium flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Verified
                    {cert.verification_method && ` via ${VERIFICATION_METHOD_LABELS[cert.verification_method]}`}
                  </p>
                  {cert.verified_at && (
                    <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">
                      Confirmed on {new Date(cert.verified_at).toLocaleDateString()}
                      {cert.verification_reference && ` • Ref: ${cert.verification_reference}`}
                    </p>
                  )}
                  {cert.verification_source_url && (
                    <a href={cert.verification_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 hover:underline text-xs mt-1">
                      View source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Rejection reason */}
              {cert.status === 'rejected' && cert.rejection_reason && (
                <div className="mt-3 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
                  <span className="font-medium">Rejected:</span> {cert.rejection_reason}
                </div>
              )}

              {cert.status === 'pending' && (
                <div className="mt-3 text-xs text-gray-400">
                  <p>Submitted — verifying against the official source.</p>
                  {cert.auto_check_notes && (
                    <p className="mt-1 text-amber-600 dark:text-amber-400">{cert.auto_check_notes}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {certs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-gray-500">No certifications added yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
