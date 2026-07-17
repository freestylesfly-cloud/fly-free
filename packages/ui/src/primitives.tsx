import { ButtonHTMLAttributes, HTMLAttributes } from "react";
import clsx from "clsx";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx("rounded bg-black px-4 py-2 text-sm font-bold text-white transition hover:opacity-90", className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded border border-black/10 bg-white p-4", className)} {...props} />;
}
