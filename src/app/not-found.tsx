import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-5 pt-10 text-center">
      <h1 className="font-display text-xl font-semibold">Page introuvable</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-grey">
        Le profil ou la page demandée n’existe plus, ou ne vous est pas accessible.
      </p>
      <Link href="/" className="btn-primary mt-5 inline-flex">
        Retour à l’accueil
      </Link>
    </div>
  );
}
