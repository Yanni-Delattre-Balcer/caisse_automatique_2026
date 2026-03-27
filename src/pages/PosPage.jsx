import React from 'react';
import { PosGrid } from '../features/pos/PosGrid';
import { CheckoutCart } from '../features/pos/CheckoutCart';

export function PosPage() {
  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <div className="flex-[3] min-w-0 h-full">
        <PosGrid />
      </div>
      <div className="flex-[2] min-w-[320px] max-w-md h-full shrink-0">
        <CheckoutCart />
      </div>
    </div>
  );
}
