import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#c7ebe3_0%,_transparent_55%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-16 pt-8">
        <header className="flex items-center justify-between">
          <p className="font-display text-2xl text-brand-800 sm:text-3xl">NEMT Care</p>
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-brand-800 hover:bg-white/60"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="mt-16 flex flex-1 flex-col justify-center gap-8 sm:mt-24">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl leading-tight text-brand-900 sm:text-5xl">
              Medical rides you can see in real time
            </h1>
            <p className="mt-4 max-w-xl text-lg text-brand-800/80">
              Book non-emergency medical transportation, watch your driver approach on a live map,
              and confirm when the trip starts and ends — built for patients, caregivers, and
              clinics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register?role=RIDER"
                className="rounded-xl bg-brand-700 px-5 py-3 text-white shadow-sm hover:bg-brand-900"
              >
                Book a ride
              </Link>
              <Link
                href="/register?role=DRIVER"
                className="rounded-xl border border-brand-600/30 bg-white/70 px-5 py-3 text-brand-800 hover:bg-white"
              >
                Drive with us
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Request & match',
                body: 'Riders request pickup and dropoff. Nearby approved drivers get the request.',
              },
              {
                title: 'Live location',
                body: 'Driver GPS streams over WebSockets so both sides see the same map.',
              },
              {
                title: 'Start & stop confirm',
                body: 'Both rider and driver confirm trip start and completion for a clear record.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-brand-100">
                <h2 className="font-display text-lg text-brand-900">{item.title}</h2>
                <p className="mt-2 text-sm text-brand-800/75">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
