"use strict";
import {
  THIRDPARTY_FORGET_IDENTITY_REQUEST,
  THIRDPARTY_GET_ACCOUNT_REQUEST,
  THIRDPARTY_SIGN_REQUEST,
  LOGIN_REJECT,
  SIGN_REJECT,
  SIGNOUT_SUCCEED,
} from "../types";
import { NetworkSettings, availableNetworks } from "../domain/network";
import { Transaction } from "@hashgraph/sdk";
import { sendAsyncMessageToContentScript } from "./messageHandler";
const AppInfo = require("../app.json");

class WalletProvider {
  isHederaWallet: boolean;
  version: string;
  network: NetworkSettings;
  constructor() {
    this.version = AppInfo.version;
    this.isHederaWallet = true;
    this.network = availableNetworks[Object.keys(availableNetworks)[0]]; //testnet
  }
  forgetIdentity() {
    return new Promise(async (resolve) => {
      await sendAsyncMessageToContentScript({
        type: THIRDPARTY_FORGET_IDENTITY_REQUEST,
      });
      resolve(SIGNOUT_SUCCEED);
    });
  }
  getAccount() {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await sendAsyncMessageToContentScript({
          type: THIRDPARTY_GET_ACCOUNT_REQUEST,
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(LOGIN_REJECT);
        }
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }
  signTransaction(transaction: Transaction) {
    return new Promise(async (resolve, reject) => {
      try {
        let txBytes = transaction.toBytes();
        const res = await sendAsyncMessageToContentScript({
          type: THIRDPARTY_SIGN_REQUEST,
          payload: {
            tx: txBytes,
          },
        });
        if (res.rejected) {
          if (res.message) return reject(res.message);
          return reject(SIGN_REJECT);
        }
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }
}

const walletProvider = new WalletProvider();
export default walletProvider;
