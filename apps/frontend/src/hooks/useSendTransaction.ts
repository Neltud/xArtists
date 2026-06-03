import { sendTransactions } from '@multiversx/sdk-dapp/services';
import { useWeb3 } from './useWeb3';

export const useSendTransaction = () => {
  const { isLoggedIn } = useWeb3();

  const send = async (transactions: any[]) => {
    if (!isLoggedIn) {
      throw new Error('Wallet non connecté');
    }

    const result = await sendTransactions({
      transactions,
      transactionsDisplayInfo: {
        processingMessage: 'Transaction en cours...',
        errorMessage: 'Échec de la transaction',
        successMessage: 'Transaction réussie !',
      },
    });

    return result;
  };

  return { send };
};