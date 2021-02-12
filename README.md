# Hedera Wallet Browser Extension

Hedera Wallet is a browser extension that is a complete Hedera Hashgraph wallet which provides an API websites can interact with without revealing the user's private keys.

## Demo

Try it out at [Hedera Wallet Playground](https://hedera-wallet-playground.web.app/#/)

## Features

- Create account with mnemonic
- Import account with mnemonic or private key
- QR code for deposits
- Supports Mainnet and Testnet accounts
- Send and receive HBAR
- Send and receive tokens created using the Hedera Token Service
- Associate tokens to accounts
- Export private key
- Link to view transaction history on Kabuto
- API for connecting to websites and signing transactions
- Lock wallet with a 4 or 6 digit PIN code
- Auto lock wallet after specified timeout
- PIN code, number of PIN code digits and auto lock duration can be configured in settings
- View HBAR balance and its USD valuation
- View balance of associated tokens

## Development

- Install [node.js](https://nodejs.org/) and npm
- Install dependencies:

```
npm install
```

- Run the project:

```
npm run dev
```

- Go to Chrome Extensions page and activate Developer Mode.
- Click `Load Unpacked` button and select the `/dist` folder, the extension will reload automatically as changes to the code are made (you will still need to close and reopen popups for changes to take effect).

## Build Extension

- Install [node.js](https://nodejs.org/) and npm.
- Install dependencies :

```
npm install
```

- Build the project :

```
npm run build
```

- Uncompressed build can be found in `/dist` folder, compressed build is `hederawallet.zip`.
- Go to Chrome Extensions page and activate Developer Mode.
- Click `Load Unpacked` button and selected the `/dist` folder.

## API Documentation

### Checking if the Hedera Wallet extension is installed

```
let isInstalled = window.hederaWallet && window.hederaWallet.isHederaWallet;
```

`isInstalled` returns true if the extension is installed and vice versa.
`window.hederaWallet` returns an object with the following values:
| Property | Example | Description |
|--|--|--|
| isHederaWallet | true | for checking if the extension is installed |
| version | "0.0.1" | extension version number |
| network | `{name: "network.testnet", address: "0.testnet.hedera.com:50211", proxy: "0.testnet.hedera.com:50211", node: {shard: 0, realm: 0, node: 3}}` | network object |

### Connecting to the extension

```
let account = await window.hederaWallet.getAccount();
```

If the sign in request is accepted by the user, `account` returns an object with the following properties:
| Property | Example | Description |
|--|--|--|
| account | "0.0.XXXXXX" | account ID of connected account |
| name | "main" | name of connected account |
| network | "network.testnet" or "network.mainnet" | network name of connected account |
| publicKey | "302**********\*\***********" | public key of connected account |

### Signing a transaction

```
import {(any transaction type you would like to use), AccountId, TransactionId} from "@hashgraph/sdk"
let connectedAccountId = AccountId.fromString("0.0.XXXXXX"); //account ID obtained from connecting to extension
let transaction = new any_transaction_type()
	.XXXXXX //configure transaction
	.setTransactionId(TransactionId.generate(connectedAccountId))
	.setNodeAccountIds([AccountId.fromString("0.0.3")])
	.freeze()
let txReceipt = await window.hederaWallet.signTransaction(transaction);
```

`txReceipt` returns the transaction receipt if the transaction is approved by the user.

### Disconnecting from the extension

```
await window.hederaWallet.forgetIdentity()
```
