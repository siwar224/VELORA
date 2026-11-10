"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { orderAhead } from "@/content/site";
import { OPEN_ORDER_EVENT } from "@/lib/data/live";

// The form itself is only downloaded the first time someone opens it.
const OrderForm = dynamic(() => import("./OrderForm"), { ssr: false });

/**
 * "Order ahead" modal on the public site. A native <dialog> (focus is trapped,
 * Escape closes, focus returns to the button that opened it) opened by any
 * button that calls openOrderForm(). Orders go to the admin's Orders board live.
 */
export default function OrderAhead() {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState(0); // remount the form each time it opens

  useEffect(() => {
    const open = () => {
      setMounted(true);
      setSession((n) => n + 1);
      ref.current?.showModal();
    };
    window.addEventListener(OPEN_ORDER_EVENT, open);
    return () => window.removeEventListener(OPEN_ORDER_EVENT, open);
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      aria-labelledby="order-title"
      // Click on the backdrop (the dialog element itself, outside the panel) closes it.
      onClick={(e) => e.target === e.currentTarget && close()}
      className="m-auto w-[min(32rem,calc(100%-2rem))] bg-milk p-0 text-espresso shadow-2xl backdrop:bg-espresso/70 backdrop:backdrop-blur-sm"
    >
      <div className="relative p-6 md:p-8">
        <button
          type="button"
          onClick={close}
          className="absolute top-3 right-3 flex size-11 items-center justify-center text-2xl leading-none text-espresso/70 hover:text-espresso"
          aria-label={orderAhead.close}
        >
          <span aria-hidden="true">×</span>
        </button>
        <h2 id="order-title" className="font-serif text-4xl font-light">
          {orderAhead.title}
        </h2>
        {mounted && <OrderForm key={session} onClose={close} />}
      </div>
    </dialog>
  );
}
