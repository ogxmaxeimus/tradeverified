import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/star-rating';
import { getFullName, getLocationString, formatDate } from '@/lib/utils';
import { TRADE_LABELS, VERIFICATION_METHOD_LABELS, type TradeType, type WorkHistory, type PortfolioItem, type Review, type TradespersonCertification, type Certification } from '@/types/database';
import { MapPin, Briefcase, Award, Shield, ShieldCheck, ExternalLink } from 'lucide-react';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (!profile) notFound();

  const { data: tradesperson } = await supabase
    .from('tradesperson_profiles')
    .select('*, skills:tradesperson_skills(*, skill:skills(*)), certifications:tradesperson_certifications(*, certification:certifications(*)), work_history(*), portfolio_items(*)')
    .eq('user_id', id)
    .single();

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles(first_name, last_name)')
    .eq('tradesperson_id', tradesperson?.id ?? '')
    .eq('status', 'approved')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  await supabase.from('profile_views').insert({ profile_id: id });
  await supabase.rpc('increment_profile_views', { profile_id: id });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32" />
        <div className="mx-auto max-w-4xl px-4 -mt-16 sm:px-6 lg:px-8 pb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <Avatar src={profile.avatar_url} firstName={profile.first_name} lastName={profile.last_name} size="xl" className="border-4 border-white dark:border-gray-900" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getFullName(profile.first_name, profile.last_name)}</h1>
                    {profile.is_verified && <Badge variant="verified"><Shield className="h-3 w-3 mr-1" />Verified</Badge>}
                  </div>
                  {tradesperson?.headline && <p className="text-gray-500 mt-1">{tradesperson.headline}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                    {tradesperson && <Badge>{TRADE_LABELS[tradesperson.trade as TradeType]}</Badge>}
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{getLocationString(profile.city, profile.state)}</span>
                    {tradesperson && <span>{tradesperson.years_experience} years experience</span>}
                    {reviews && reviews.length > 0 && (
                      <span className="flex items-center gap-1">
                        <StarRating rating={avgRating} size="sm" />
                        <span>({reviews.length} reviews)</span>
                      </span>
                    )}
                  </div>
                  {profile.bio && <p className="mt-4 text-gray-600 dark:text-gray-400">{profile.bio}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {tradesperson?.work_history && tradesperson.work_history.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Work History</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {tradesperson.work_history.map((wh: WorkHistory) => (
                  <div key={wh.id} className="border-l-2 border-blue-200 pl-4">
                    <h4 className="font-semibold">{wh.title}</h4>
                    <p className="text-sm text-gray-500">{wh.company_name} • {formatDate(wh.start_date)} - {wh.is_current ? 'Present' : wh.end_date ? formatDate(wh.end_date) : ''}</p>
                    {wh.description && <p className="text-sm text-gray-600 mt-1">{wh.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tradesperson?.portfolio_items && tradesperson.portfolio_items.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tradesperson.portfolio_items.map((item: PortfolioItem) => (
                    <div key={item.id} className="rounded-lg overflow-hidden border">
                      <div className="grid grid-cols-2 gap-0.5">
                        {item.before_image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.before_image_url} alt="Before" className="aspect-square object-cover" />
                        )}
                        {item.after_image_url && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.after_image_url} alt="After" className="aspect-square object-cover" />
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(() => {
            const verifiedCerts = (tradesperson?.certifications as (TradespersonCertification & { certification: Certification })[] | undefined)
              ?.filter((c) => c.status === 'verified') ?? [];
            if (verifiedCerts.length === 0) return null;
            return (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Verified Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {verifiedCerts.map((cert) => (
                    <div key={cert.id} className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{cert.certification?.name}</h4>
                          <p className="text-sm text-gray-500">
                            {cert.certification?.issuing_body}
                            {cert.license_number && ` • Lic# ${cert.license_number}`}
                            {cert.issuing_state && ` • ${cert.issuing_state}`}
                          </p>
                        </div>
                        <Badge variant="verified" className="flex items-center gap-1 shrink-0">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                        {cert.verification_method && <span>Checked via {VERIFICATION_METHOD_LABELS[cert.verification_method]}</span>}
                        {cert.verified_at && <span> • {formatDate(cert.verified_at)}</span>}
                        {cert.verification_source_url && (
                          <a href={cert.verification_source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-2 hover:underline">
                            Source <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {reviews && reviews.length > 0 && (
            <Card className="mt-6">
              <CardHeader><CardTitle>Reviews</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review: Review) => (
                  <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0">
                    <StarRating rating={review.rating} size="sm" />
                    {review.title && <h4 className="font-medium mt-1">{review.title}</h4>}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {review.reviewer?.first_name} {review.reviewer?.last_name} • {formatDate(review.created_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
