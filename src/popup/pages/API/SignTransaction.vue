<template>
  <main class="prompt image-bg">
    <h3 class="center">Approve Transaction</h3>
    <div class="hostrow">
      <span class="host_label">{{ host }}</span>
    </div>
    <div v-if="!getLockState">
      <div class="row">
        <span class="action_caption">Signing with</span>
        <span class="sign__name">{{ wallet.name }}</span>
        <div class="sign__address">{{ wallet.account }}</div>
      </div>
      <div>
        on <b>{{ wallet.network }}</b>
      </div>
      <div class="transaction column">
        <object-inspector class="inspector" :data="transaction" />
      </div>
      <div class="invoice-content">
        <div class="invoice">
          <div class="invoice__divider"></div>
          <div class="invoice__row">
            <span>Network Fee (estimated)</span>
            <span>{{ getTxFee }} HBAR</span>
          </div>
        </div>
      </div>
      <div v-if="!loading">
        <div class="password-content">
          <label class="input-label">
            Password
            <input
              class="input-field"
              type="password"
              name="password"
              ref="password"
              v-model="password"
              placeholder="Input your password"
              v-on:keyup.enter="approve"
            />
          </label>
        </div>
      </div>
      <div class="footer">
        <div class="button-group">
          <button class="outline" @click="reject">Reject</button>
          <button class="primary" @click="approve" :disabled="!password">
            Approve
          </button>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="error-container">
        <p>
          Sorry. The wallet is locked. You should unlock it first in the
          extension.
        </p>
      </div>
      <button class="primary flex mt-20" @click="lockReject">OK</button>
    </div>
    <notifications
      group="notify"
      width="250"
      :max="4"
      class="notifiaction-container"
    />
  </main>
</template>
<script>
import {
  decryptKeystore,
  constructClient,
} from "../../../services/AccountService";
import { mapState, mapGetters } from "vuex";
import {
  GET_WALLET_SERVICE_STATE,
  THIRDPARTY_SIGN_CONNECT,
  THIRDPARTY_SIGNATURE_KEY_SUCCESS_RESPONSE,
  THIRDPARTY_SIGNATURE_KEY_REJECT_RESPONSE,
  WALLET_LOCKED,
} from "~/types";
import { AccountId, Transaction } from "@hashgraph/sdk";
import ObjectInspector from "vue-object-inspector";
import _ from "lodash";

export default {
  components: {
    ObjectInspector,
  },
  data: () => ({
    transaction: "",
    viewOption: "default",
    suggestion: null,
    loading: false,
    host: "",
    password: "",
    type: "Send",
    hasError: false,
    privateKey: null,
    wallet: { name: "" },
  }),
  computed: {
    ...mapGetters(["getLockState"]),
    ...mapState({
      accounts: (state) => state.wallets.accounts,
    }),
    getTxFee() {
      return 0.01;
    },
  },
  methods: {
    async signTransaction() {
      let txReceipt;
      try {
        let senderAcc = AccountId.fromString(this.wallet.account);
        let client = await constructClient(
          senderAcc,
          this.privateKey,
          this.wallet.network
        );
        txReceipt = await (await this.transaction.execute(client)).getReceipt(
          client
        );
        chrome.runtime.sendMessage({
          action: THIRDPARTY_SIGNATURE_KEY_SUCCESS_RESPONSE,
          payload: {
            txReceipt,
          },
        });
      } catch (err) {
        this.hasError = true;
        this.caption = err.message;
        this.$notify({
          group: "notify",
          type: "error",
          text: err.message,
        });
      }
    },
    async approve() {
      let privateKey;
      if (!this.password) return;
      if (!this.wallet) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Account is invalid",
        });
        return false;
      }
      privateKey = await decryptKeystore(this.wallet.keystore, this.password);
      if (!privateKey) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Incorrect password",
        });
        return false;
      }
      this.privateKey = privateKey;

      this.$store.commit("loading", true);
      await this.signTransaction();
      this.$store.commit("loading", false);
    },

    async reject() {
      window.close();
    },
    lockReject() {
      chrome.runtime.sendMessage({
        action: THIRDPARTY_SIGNATURE_KEY_REJECT_RESPONSE,
        payload: {
          message: WALLET_LOCKED,
        },
      });
    },
  },
  updated() {
    if (this.$refs.password) this.$refs.password.focus();
  },
  created() {
    this.loading = true;
    chrome.runtime.sendMessage(
      { action: GET_WALLET_SERVICE_STATE },
      async ({ state } = {}) => {
        if (state && state.tx && state.host && state.session) {
          try {
            let txArray = [];
            for (var i in state.tx) {
              txArray.push([state.tx[i]]);
            }
            this.transaction = Transaction.fromBytes(new Uint8Array(txArray));
            this.loading = false;
            this.host = state.host;
            this.wallet = _.find(this.accounts, {
              account: state.session.account.account,
            });
          } catch (err) {
            console.error(err);
            this.loading = false;
            this.$notify({
              group: "notify",
              type: "error",
              text: err.message,
            });
          }
        } else {
          window.close();
        }
      }
    );
    chrome.runtime.connect({ name: THIRDPARTY_SIGN_CONNECT });
  },
};
</script>
<style scoped>
h3 {
  margin-top: 0px;
  margin-bottom: 0px;
}
.password-content {
  margin-bottom: 10px;
}
.center {
  text-align: center;
}
.sign__name {
  font-weight: 700;
  color: #8259ef;
}
.sign__address {
  color: #8259ef;
}
.txRow {
  font-size: 14px;
  display: flex;
  justify-content: space-between;
}
.amount {
  color: #2d84eb;
  cursor: pointer;
  font-weight: 700;
}
.data_container {
  display: flex;
  gap: 10px;
  align-items: center;
}
.txn_container {
  height: 170px;
  padding-right: 5px;
  overflow: auto;
  border-bottom: 1px solid #ddd;
}
.data_view_select {
  border: 1px solid #989494;
  border-radius: 6px;
}
.data_view_select:focus {
  outline: none;
}
.data_container .data_caption {
  font-weight: 600;
  margin-top: 5px;
  margin-bottom: 5px;
}
.data_content {
  word-break: break-word;
  font-size: 12px;
  font-style: italic;
  padding: 5px 0 10px 0;
}
.action_caption {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 0px;
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
.error-container {
  height: 360px;
}
.invoice-content {
  margin-top: 1.5rem;
  font-size: 14px;
}
.inspector {
  height: 200px;
  overflow: auto;
}
</style>
