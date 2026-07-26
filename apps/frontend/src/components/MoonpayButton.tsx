import React from 'react';

export const MoonpayButton: React.FC = () => {
  const handleBuy = () => {
    const moonpayUrl = `https://buy.moonpay.com/?apiKey=YOUR_PUBLIC_KEY&currencyCode=EGLD&walletAddress=USER_WALLET`;
    window.open(moonpayUrl, '_blank');
  };

  return (
    <button
      onClick={handleBuy}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2 transition-all"
    >
      💰 Acheter EGLD/TRO avec Moonpay
    </button>
  );
};