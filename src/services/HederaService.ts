import {
  AccountId,
  TokenId,
  Client,
  PrivateKey,
  Hbar,
  TransactionReceipt,
} from "@hashgraph/sdk";

import { Token } from "../domain/token";

import { kabutoRequest } from "./utils/request";

import { constructClient } from "./AccountService";
import { NetworkName } from "../domain/network";

// Does the operator key belong to this account?
export async function testClient(
  account: import("@hashgraph/sdk").AccountId,
  client: import("@hashgraph/sdk").Client
): Promise<boolean> {
  const { TransferTransaction } = await import(
    /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
  );
  try {
    const tx = new TransferTransaction();
    tx.addHbarTransfer(account, 0); // Transfer 0 Tinybar
    tx.setMaxTransactionFee(Hbar.fromTinybars(1)); // Max Fee 1 Tinybar
    await (await tx.execute(client)).getReceipt(client);
    return true;
  } catch (error) {
    let errorString = error.toString();
    if (
      errorString.includes("INSUFFICIENT_TX_FEE") ||
      errorString.includes("INSUFFICIENT_PAYER_BALANCE")
    ) {
      return true;
    }
    console.error("testClient error =", error);
    return false;
  }
  return false;
}

export async function getBalance(
  accountId: string,
  key: string,
  network: string
): Promise<Hbar | null> {
  const { AccountBalanceQuery } = await import(
    /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
  );
  try {
    let privateKey = PrivateKey.fromString(key);
    let account = AccountId.fromString(accountId);
    let client = await constructClient(account, privateKey, network);
    const tokenBalances = await new AccountBalanceQuery()
      .setAccountId(account)
      .execute(client);
    return tokenBalances.hbars;
  } catch (error) {
    throw error;
  }
}

interface token {
  id: string;
  decimals: number;
}
interface TokensResult {
  tokens: token[];
}

export async function getTokenDecimals( //temporary bypass, Kabuto's API is down
  keys: string[],
  testnet = false
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  keys.forEach((key) => {
    results.set(key, 0);
  });
  return results;
}

/**
export async function getTokenDecimals(
  keys: string[],
  testnet = false
): Promise<Map<string, number>> {
  // /v1/token?q={"$or": [{"id": "0.0.253281"}, {"id": "0.0.253335"}]}
  const queryList: Array<Record<string, string>> = [];
  keys.forEach((key) => {
    queryList.push({ id: key });
  });

  const results = new Map<string, number>();
  const promises: Array<Promise<TokensResult>> = [];

  let i = 0;
  while (i * 50 < keys.length) {
    const querySublist = queryList.slice(i * 50, (i + 1) * 50);
    i += 1;

    promises.push(
      kabutoRequest<TokensResult>(
        `v1/token?q={"$or": ${JSON.stringify(querySublist)}}`,
        testnet
      )
    );
  }

  (await Promise.all(promises)).forEach((tokensResult) => {
    tokensResult.tokens.forEach((token) => {
      results.set(token.id, token.decimals);
    });
  });

  return results;
}
**/

export async function getTokens(
  accountId: string,
  key: string,
  network: string
): Promise<Token[] | null> {
  const { AccountBalanceQuery } = await import(
    /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
  );
  let privateKey = PrivateKey.fromString(key);
  let account = AccountId.fromString(accountId);
  let client = await constructClient(account, privateKey, network);
  let testnet = network === NetworkName.TESTNET;
  try {
    const tokenBalances = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);

    const keys = [...tokenBalances.tokens.keys()];
    const balances = [...tokenBalances.tokens.values()];
    const decimals: Map<string, number> = await getTokenDecimals(
      keys.map((key) => key.toString()),
      testnet ?? false
    );

    const tokens: Token[] = [];
    for (const [i, element] of keys.entries()) {
      let tokenDecimals = decimals.get(element.toString());
      if (!tokenDecimals) {
        tokenDecimals = 0;
      }
      tokens.push({
        tokenId: element,
        balance: balances[i],
        decimals: tokenDecimals,
      });
    }

    return tokens;
  } catch (error) {
    throw error;
  }
}

export async function associateTokenWithAccount(
  tokenId: TokenId,
  accountId: string,
  key: string,
  network: string
): Promise<void> {
  const { TokenAssociateTransaction } = await import(
    /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
  );
  let privateKey = PrivateKey.fromString(key);
  let account = AccountId.fromString(accountId);
  let client = await constructClient(account, privateKey, network);
  try {
    await (
      await new TokenAssociateTransaction()
        .setAccountId(accountId)
        .setTokenIds([tokenId])
        .execute(client)
    ).getReceipt(client);
  } catch (error) {
    throw error;
  }
}

export async function sendToken(
  tokenId: TokenId,
  recipient: AccountId,
  client: Client,
  amount: number,
  memo?: string | null
): Promise<TransactionReceipt> {
  try {
    const { TransferTransaction } = await import(
      /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
    );
    const tx = new TransferTransaction()
      .addTokenTransfer(tokenId, client.operatorAccountId, amount * -1)
      .addTokenTransfer(tokenId, recipient, amount);

    if (memo != null) {
      tx.setTransactionMemo(memo);
    }

    return await (await tx.execute(client)).getReceipt(client);
  } catch (error) {
    throw error;
  }
}

export async function sendHbar(
  recipient: AccountId,
  client: Client,
  amount: number,
  memo?: string | null
): Promise<TransactionReceipt> {
  try {
    const { TransferTransaction } = await import(
      /* webpackChunkName: "hashgraph" */ "@hashgraph/sdk"
    );
    const tx = new TransferTransaction()
      .addHbarTransfer(client.operatorAccountId, new Hbar(amount * -1))
      .addHbarTransfer(recipient, new Hbar(amount));

    if (memo != null) {
      tx.setTransactionMemo(memo);
    }

    return await (await tx.execute(client)).getReceipt(client);
  } catch (error) {
    throw error;
  }
}
