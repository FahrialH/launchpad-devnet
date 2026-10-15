export const SolanaMobileWalletAdapterWalletName = 'SolanaMobileWalletAdapter' as const;

export class SolanaMobileWalletAdapter {
  name = SolanaMobileWalletAdapterWalletName;
  url = 'https://solanamobile.com';
  icon = '';
  supportedTransactionVersions = null;
  publicKey = null;
  connecting = false;
  connected = false;
  readyState = 'NotDetected';
  connect = async () => {};
  disconnect = async () => {};
  sendTransaction = async () => '';
  signTransaction = async (tx: any) => tx;
  signAllTransactions = async (txs: any[]) => txs;
  signMessage = async (msg: any) => msg;
}

export const createDefaultAddressSelector = () => () => {};
export const createDefaultAuthorizationResultCache = () => ({});
export const createDefaultWalletNotFoundHandler = () => () => {};
