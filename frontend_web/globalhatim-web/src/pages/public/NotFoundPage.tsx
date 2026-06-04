import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="container py-section flex flex-col items-center gap-6 text-center">
      <p className="font-sans text-label-md uppercase tracking-widest text-gold dark:text-gold">404</p>
      <h1 className="font-serif text-headline-lg-mobile lg:text-headline-lg">Sayfa bulunamadı</h1>
      <Link
        to="/"
        className="font-sans text-label-md uppercase tracking-widest underline underline-offset-4 hover:text-gold dark:hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
      >
        Ana sayfaya dön
      </Link>
    </section>
  )
}
