import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="empty">
      <h1 className="section-title">Nothing on this frequency</h1>
      <p>
        That show may have been moved or renamed. <Link href="/">Back to the archive</Link>.
      </p>
    </section>
  );
}
