<template>
  <div>
    <main class="prompt">
      <div class="header-row">
        <img src="images/hedera-wallet-big.png" alt="Hedera" />
        <span>Hedera Wallet</span>
      </div>
      <h3>Sign in Request</h3>
      <div class="hostrow">
        <span class="host_label">{{ host }}</span>
      </div>
      <div class="login-container">
        <div v-if="!getLockState">
          <div v-if="!wallets.accounts.length">
            <p>
              No accounts. You should create an account in the extension first.
            </p>
          </div>
          <div v-else>
            <div
              class="card"
              v-for="(account, index) in wallets.accounts"
              :key="index"
              @click="selectAccount(index)"
            >
              <div class="card-item" :class="{ active: selected === index }">
                <div class="card-item-name-box">
                  <div>{{ compressName(account.name) }}</div>
                </div>
                <div class="account-address">{{ account.address }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <p>
            Sorry, the wallet is locked. Please unlock it in the extension.
          </p>
        </div>
      </div>
      <div
        class="button-group footer"
        v-if="wallets.accounts.length && !getLockState"
      >
        <button class="outline" @click="deny">Deny</button>
        <button class="primary" :disabled="selected < 0" @click="accept">
          Accept
        </button>
      </div>
      <div v-else>
        <button class="primary flex mt-20" @click="reject">OK</button>
      </div>
    </main>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import {
  THIRDPARTY_GET_ACCOUNT_CONNECT,
  GET_WALLET_SERVICE_STATE,
  THIRDPARTY_GET_ACCOUNT_SUCCESS_RESPONSE,
  THIRDPARTY_GET_ACCOUNT_REJECT_RESPONSE,
  WALLET_LOCKED,
  UNKNOWN_ERROR,
  NO_ACCOUNTS_ERROR,
} from "~/types";
export default {
  data: () => ({
    selected: -1,
    host: "",
  }),
  computed: {
    ...mapGetters(["getLockState"]),
    ...mapState({
      wallets: (state) => state.wallets,
    }),
  },
  mounted() {
    chrome.runtime.sendMessage(
      { action: GET_WALLET_SERVICE_STATE },
      ({ state } = {}) => {
        if (state && state.host) {
          this.host = state.host;
        } else {
          window.close();
        }
      }
    );
    chrome.runtime.connect({ name: THIRDPARTY_GET_ACCOUNT_CONNECT });
  },
  methods: {
    compressName(str) {
      if (str.length > 20)
        return (
          str.substr(0, 10) + "..." + str.substr(str.length - 10, str.length)
        );
      return str;
    },

    selectAccount(index) {
      this.selected = index;
    },
    deny() {
      window.close();
    },
    reject() {
      const message = this.getLockState
        ? WALLET_LOCKED
        : !this.wallets.accounts.length
        ? NO_ACCOUNTS_ERROR
        : UNKNOWN_ERROR;
      chrome.runtime.sendMessage({
        action: THIRDPARTY_GET_ACCOUNT_REJECT_RESPONSE,
        payload: {
          message,
        },
      });
    },
    accept() {
      const account = this.wallets.accounts[this.selected];
      chrome.runtime.sendMessage({
        action: THIRDPARTY_GET_ACCOUNT_SUCCESS_RESPONSE,
        payload: {
          network: account.network,
          name: account.name,
          account: account.account,
          publicKey: account.publicKey,
        },
      });
    },
  },
};
</script>
<style scoped>
h3 {
  text-align: center;
  margin-bottom: 0px;
  margin-top: 0px;
}
.login-container {
  padding-right: 5px;
  height: 370px;
  overflow: auto;
}
.card {
  background: #f9f9f9;
  color: #222222;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgb(0, 0, 0, 0.1);
  padding: 12px 10px 16px 16px;
  margin-bottom: 8px;
  cursor: pointer;
}

.card-item {
  background: url("images/checkbox_off@2x.png") no-repeat right center/20px;
}

.card-item.active {
  background: url("images/checkbox_on@2x.png") no-repeat right center/20px;
}

.card-item-name-box {
  display: flex;
  gap: 10px;
  padding-right: 25px;
}

.account-address {
  font-size: 11px;
}
.hostrow {
  margin-bottom: 10px;
  text-align: center;
  font-size: 13px;
}
.host_label {
  color: #2d84eb;
  font-size: 1rem;
}
.header-row {
  display: flex;
  justify-content: center;
  flex: 1;
  font-size: 1rem;
  font-weight: 600;
  color: #222222;
  margin-bottom: 10px;
}
.header-row img,
.header-row span {
  display: block;
}
.header-row img {
  margin-right: 5px;
  width: 26px;
  height: 25px;
}
</style>
