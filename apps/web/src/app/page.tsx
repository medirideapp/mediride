import Link from 'next/link';

const products = [
  {
    id: 'concierge',
    title: 'MediRide Concierge',
    subtitle: 'Like Lyft Concierge',
    body: 'Clinics and care teams arrange rides for patients — now or scheduled later. Patients enjoy the ride without needing the app.',
  },
  {
    id: 'assisted',
    title: 'MediRide Assisted',
    subtitle: 'Like Lyft Assisted',
    body: 'Door-to-door help: drivers meet patients at the entrance, offer an arm, and help with small belongings.',
  },
  {
    id: 'live',
    title: 'Live tracking',
    subtitle: 'Safety & visibility',
    body: 'Patients, caregivers, and coordinators see the same live map with start and stop confirmation.',
  },
  {
    id: 'pass',
    title: 'Organization Pass',
    subtitle: 'Like Lyft Pass',
    body: 'Cover ride costs for patients or staff with monthly budgets and per-ride caps — managed in the admin Pass desk.',
  },
];

const audiences = [
  {
    title: 'Health systems & clinics',
    body: 'Rides from facilities to homes and appointments across the continuum of care.',
  },
  {
    title: 'Payers & NEMT',
    body: 'Help members get to appointments, pharmacies, and wellness programs.',
  },
  {
    title: 'Caregivers & families',
    body: 'Book and watch the trip live so no one waits alone at the curb.',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#c7ebe3_0%,_transparent_50%),radial-gradient(ellipse_at_bottom_right,_#99f6e4_0%,_transparent_45%)]" />

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-8">
        <header className="flex items-center justify-between">
          <p className="font-display text-2xl text-brand-800 sm:text-3xl">MediRide</p>
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

        {/* Hero — Lyft Healthcare style: brand + one promise + CTA */}
        <section className="mt-16 max-w-2xl sm:mt-20">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            Non-emergency medical transportation
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-brand-900 sm:text-5xl">
            The quickest route to care
          </h1>
          <p className="mt-4 text-lg text-brand-800/80">
            Reliable medical rides for patients and staff — book now or later, track live, and
            confirm every trip start and stop.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?role=RIDER"
              className="rounded-xl bg-brand-700 px-5 py-3 text-white shadow-sm hover:bg-brand-900"
            >
              Book a medical ride
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-brand-600/30 bg-white/70 px-5 py-3 text-brand-800 hover:bg-white"
            >
              Clinic / admin sign in
            </Link>
          </div>
        </section>

        {/* Products — mirrors Lyft Healthcare product cards */}
        <section id="products" className="mt-20">
          <h2 className="font-display text-2xl text-brand-900 sm:text-3xl">
            Our healthcare products
          </h2>
          <p className="mt-2 max-w-2xl text-brand-800/75">
            Inspired by how Lyft Healthcare serves health systems — built for your MediRide fleet
            and coordinators.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white/75 p-6 shadow-sm ring-1 ring-brand-100"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {p.subtitle}
                </p>
                <h3 className="mt-1 font-display text-xl text-brand-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-800/80">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it’s for */}
        <section className="mt-16">
          <h2 className="font-display text-2xl text-brand-900">Rides for every need</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl bg-brand-900 p-5 text-brand-50">
                <h3 className="font-display text-lg">{a.title}</h3>
                <p className="mt-2 text-sm text-brand-100/85">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-white/80 p-8 text-center ring-1 ring-brand-100">
          <h2 className="font-display text-2xl text-brand-900">Start moving your patients</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-brand-800/75">
            Register as a rider, driver, or use the admin Concierge desk to book door-to-door
            medical trips.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?role=DRIVER"
              className="rounded-xl border border-brand-200 px-5 py-3 text-brand-800 hover:bg-mist"
            >
              Drive with MediRide
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-5 py-3 text-white hover:bg-brand-700"
            >
              Create account
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
