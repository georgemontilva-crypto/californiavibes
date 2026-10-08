import { ProductShot } from "@/components/ProductShot";
import { useCart } from "@/lib/cart";
import { accentStyle, canBuy, type CatalogProduct } from "@/lib/catalog";
import { formatMoney } from "@shared/store";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export function Price({
  cents,
  compareAt,
  className,
}: {
  cents: number;
  compareAt?: number | null;
  className?: string;
}) {
  if (cents <= 0) return <span className={className}>Coming soon</span>;
  return (
    <span className={className}>
      {compareAt && compareAt > cents && (
        <s className="mr-2 font-semibold text-haze/70">{formatMoney(compareAt)}</s>
      )}
      {formatMoney(cents)}
    </span>
  );
}

export function useAddToCart() {
  const cart = useCart();
  return (p: { id: number; name: string; collection: string | null }, qty = 1) => {
    cart.add(p.id, qty);
    toast.success(`${p.name} ${p.collection ?? ""} added to your cart`, {
      action: { label: "View cart", onClick: () => cart.setOpen(true) },
    });
  };
}

export function ProductCard({
  product,
  showLine = true,
}: {
  product: CatalogProduct;
  showLine?: boolean;
}) {
  const add = useAddToCart();
  const buyable = canBuy(product);

  return (
    <div
      style={accentStyle(product.accentColor)}
      className="card group flex h-full flex-col p-4 transition-transform duration-300 hover:-translate-y-1"
    >
      <Link href={`/products/${product.slug}`} className="block flex-1">
        <ProductShot
          src={product.imageUrl}
          alt={`${product.name} ${product.collection ?? ""}`}
          className="mx-auto w-full max-w-[280px] transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <h3 className="script mt-2 text-[1.7rem] leading-tight text-cream">
          {product.name}
        </h3>
        {showLine && product.collection && (
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.16em] text-accent">
            {product.collection}
          </p>
        )}
        {product.subtitle && (
          <p className="mt-1 text-sm text-haze">{product.subtitle}</p>
        )}
      </Link>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Price
          cents={product.priceCents}
          compareAt={product.compareAtCents}
          className="text-lg font-extrabold text-cream"
        />
        {buyable ? (
          <button
            type="button"
            onClick={() => add(product)}
            className="btn btn-accent btn-sm"
            aria-label={`Add ${product.name} ${product.collection ?? ""} to cart`}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : (
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-haze">
            {product.inStock ? "Soon" : "Sold out"}
          </span>
        )}
      </div>
    </div>
  );
}
