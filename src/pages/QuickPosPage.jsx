import React from 'react';
import { QuickPosGrid } from '../features/pos/QuickPosGrid';
import { CheckoutCart } from '../features/pos/CheckoutCart';

export function QuickPosPage() {
  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <div className="flex-[3] min-w-0 h-full">
        <QuickPosGrid />
      </div>
      <div className="flex-[2] min-w-[320px] max-w-md h-full shrink-0">
        <CheckoutCart />
      </div>
    </div>
  );
}
