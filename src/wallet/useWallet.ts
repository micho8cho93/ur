import { useContext } from 'react';

import { WalletContext } from './WalletContext';

export const useWallet = () => {
  const walletContext = useContext(WalletContext);

  if (!walletContext) {
    throw new Error('useWallet must be used within a WalletProvider.');
  }

  return walletContext;
};
