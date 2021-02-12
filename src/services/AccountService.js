import {
  AccountId,
  Client,
  Mnemonic,
  PrivateKey,
  TokenId,
} from "@hashgraph/sdk";

import { NetworkName } from "../domain/network";
import { testClient } from "./HederaService";

export async function generatePhrase() {
  return Mnemonic.generate();
}

export async function validatePrivateKey(privateKey) {
  try {
    PrivateKey.fromString(privateKey);
    return true;
  } catch (error) {
    return false;
  }
}

export async function validateMnemonic(mnemonic) {
  try {
    await PrivateKey.fromMnemonic(mnemonic);
    return true;
  } catch (error) {
    return false;
  }
}

export async function validateAccountID(accountID) {
  try {
    if (accountID.length < 1) {
      return false;
    }
    let account = AccountId.fromString(accountID);
    return account;
  } catch (error) {
    return false;
  }
}

export async function validateTokenID(tokenID) {
  try {
    if (tokenID.length < 1) {
      return false;
    }
    let token = await TokenId.fromString(tokenID);
    return token;
  } catch (error) {
    return false;
  }
}

export async function getPublicKeyFromPrivateKey(privateKey) {
  try {
    let publicKey = PrivateKey.fromString(privateKey).publicKey;
    return publicKey;
  } catch (error) {
    return false;
  }
}

export async function createAccountFromMnemonic(
  name,
  mnemonic,
  password,
  accountIDString,
  network
) {
  try {
    let privateKey = await PrivateKey.fromMnemonic(
      await Mnemonic.fromString(mnemonic)
    );
    let account = AccountId.fromString(accountIDString);
    let client = await constructSession(account, privateKey, network);
    if (!client) {
      return false;
    }
    let publicKey = privateKey.publicKey.toString();
    const keystore = await privateKey.toKeystore(password);
    const keystoreString = new TextDecoder().decode(keystore);
    return {
      name,
      account: accountIDString,
      key: privateKey.toString(),
      publicKey,
      keystore: keystoreString,
      network,
    };
  } catch (error) {
    console.error("createAccountFromMnemonic error = ", error);
    return false;
  }
}

export async function createAccountFromPrivateKey(
  name,
  privateKeyString,
  password,
  accountIDString,
  network
) {
  try {
    let privateKey = PrivateKey.fromString(privateKeyString);
    let account = AccountId.fromString(accountIDString);
    let client = await constructSession(account, privateKey, network);
    if (!client) {
      return false;
    }
    let publicKey = privateKey.publicKey.toString();
    const keystore = await privateKey.toKeystore(password);
    const keystoreString = new TextDecoder().decode(keystore);
    return {
      name,
      account: accountIDString,
      key: privateKeyString,
      publicKey,
      keystore: keystoreString,
      network,
    };
  } catch (error) {
    console.error("createAccountFromPrivateKey error = ", error);
    return false;
  }
}

export async function createAccountFromKeystore(
  name,
  keystoreBytes,
  keystorePass,
  password,
  accountIDString,
  network
) {
  try {
    let privateKey = await PrivateKey.fromKeystore(keystoreBytes, keystorePass);
    let account = AccountId.fromString(accountIDString);
    let client = await constructSession(account, privateKey, network);
    if (!client) {
      return 1;
    }
    let publicKey = privateKey.publicKey.toString();
    const keystore = await privateKey.toKeystore(password);
    const keystoreString = new TextDecoder().decode(keystore);
    return {
      name,
      account: accountIDString,
      key: privateKey.toString(),
      publicKey,
      keystore: keystoreString,
      network,
    };
  } catch (error) {
    console.error("createAccountFromKeystore error = ", error);
    return false;
  }
}

export async function constructClient(account, privateKey, network) {
  let client = null;
  if (network !== NetworkName.CUSTOM) {
    if (network === NetworkName.MAINNET) {
      client = Client.forMainnet();
    } else if (network === NetworkName.TESTNET) {
      client = Client.forTestnet();
    } else if (network === NetworkName.PREVIEW) {
      client = Client.forPreviewnet();
    }
  } else {
    return false;
  }
  if (client != null) {
    client.setOperator(account, privateKey);
  }
  return client;
}

export async function constructSession(account, privateKey, network) {
  try {
    const client = await constructClient(account, privateKey, network);
    if (client != null) {
      if (await testClient(account, client)) {
        // Throws
        return client;
      }
    }
  } catch (error) {
    console.error("constructSession error =", error);
    throw error;
  }
  return false;
}

export function getKabutoLink(account, network) {
  if (network !== NetworkName.CUSTOM) {
    if (network === NetworkName.MAINNET) {
      return "https://explorer.kabuto.sh/mainnet/id/" + account;
    } else if (network === NetworkName.TESTNET) {
      return "https://explorer.kabuto.sh/testnet/id/" + account;
    } else if (network === NetworkName.PREVIEW) {
      return false;
    }
  } else {
    return false;
  }
  return false;
}

export async function decryptKeystore(keystoreString, password) {
  let keystore = new TextEncoder().encode(keystoreString);
  try {
    return await PrivateKey.fromKeystore(keystore, password);
  } catch (error) {
    console.error(error);
    return false;
  }
}
