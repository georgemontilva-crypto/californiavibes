import { PublicLayout } from "@/components/PublicLayout";
import { useTitle } from "@/lib/catalog";
import { Link } from "wouter";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <PublicLayout>
      <div className="container max-w-2xl py-24">
        <p className="font-display text-8xl text-gold">404</p>
        <h1 className="mt-2 text-5xl text-cream md:text-6xl">
          This page doesn't exist
        </h1>
        <p className="mt-4 text-lg text-haze">
          The link may be old. Head back home or browse the products.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/products" className="btn btn-gold">
            Shop products
          </Link>
          <Link href="/" className="btn btn-ghost">
            Go to the home page
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
