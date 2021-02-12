import walletProvider from "./WalletProvider";

Object.defineProperty(window, "hederaWallet", {
  enumerable: true,
  writable: true,
  configurable: true,
  value: walletProvider,
});
