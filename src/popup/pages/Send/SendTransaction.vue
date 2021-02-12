<template>
  <div>
    <app-header
      :subtitle="getHeaderName"
      @refresh="refreshData"
      @networkChanged="refreshData"
      v-bind:backRoute="getRoute"
    />
    <main class="main">
      <div v-if="scene === 1">
        <form
          @submit.prevent="showConfirmDialog"
          action
          method="post"
          class="send-form"
          autocomplete="off"
        >
          <div
            v-show="message.show"
            class="message"
            :class="[message.type]"
            @click="onMessageClick"
          >
            <span v-if="message.type === 'success'"
              >Transaction completed (Click here to view your
              transactions)</span
            >
            <span v-else>{{ message.text }}</span>
          </div>
          <div :class="{ row: !isToken }">
            <label class="input-label" :class="{ recipient: !isToken }">
              Recipient Account ID
              <input
                class="input-field"
                type="text"
                name="recipient"
                ref="recipient"
                placeholder="0.0.XXXXXX"
                v-model="recipient"
              />
            </label>
          </div>
          <div :class="{ row: !isToken }">
            <label class="input-label" :class="{ amount: !isToken }">
              Amount
              <input
                class="input-field"
                type="number"
                name="amount"
                ref="amount"
                step="any"
                placeholder="Amount"
                v-model="amount"
                v-on:keyup.enter="showConfirmDialog"
              />
              <div
                class="maximum-label"
                v-show="!loading"
                @click="setMaxBalance"
              >
                Maximum: {{ getMaxBalance }}
                <b>{{ this.selectedToken.tokenId }}</b>
              </div>
            </label>
            <label v-if="!isToken" class="input-label token">
              Token
              <select class="input-field" v-model="selectedToken">
                <option
                  v-for="(token, index) in tokenList"
                  :key="index"
                  :value="token"
                  >{{ token.tokenId }}</option
                >
              </select>
            </label>
          </div>
          <div>
            <label class="input-label" :class="memo">
              Memo
              <input
                class="input-field"
                type="text"
                name="memo"
                ref="memo"
                placeholder="Enter memo (optional)"
                v-model="memo"
              />
            </label>
          </div>
          <button class="primary flex" type="submit">Send</button>
        </form>
      </div>
      <!-- Approve Transaction Dialog -->
      <div v-else>
        <h3 class="center">Approve Transaction</h3>
        <p class="addressRow">
          From
          <span class="address__name">
            {{ getFromAccount }}
          </span>
        </p>
        <div class="transaction column">
          <div class="row">
            <div class="transaction__meta">
              <div class="transaction__caption">
                Sending
                <b>{{ amount }}</b>
                {{ this.selectedToken.tokenId }}
              </div>
            </div>
          </div>
          <div v-show="this.memo !== ''" class="transaction__information">
            <div class="transaction__meta">
              <div class="transaction__caption">
                With memo
                <b>{{ this.memo }}</b>
              </div>
            </div>
          </div>
        </div>
        <p class="addressRow">
          To
          <span class="address__name">{{ recipientID }}</span>
        </p>
        <div class="invoice-content">
          <div class="invoice">
            <div class="invoice__row">
              <span>Amount</span>
              <span
                ><b>{{ amount }}</b> {{ this.selectedToken.tokenId }}</span
              >
            </div>
            <div class="invoice__row">
              <span>Network Fee (estimated)</span>
              <span
                ><b>{{ getTxFee }}</b> HBAR</span
              >
            </div>
            <div class="invoice__divider"></div>
            <div class="invoice__row">
              <span>Total (estimated)</span>
              <span v-if="!isCustomToken"
                ><b>{{ getTotal }}</b> HBAR</span
              >
              <span v-else
                ><b>{{ getTotal }}</b> {{ this.selectedToken.tokenId }} +
                <b>{{ getTxFee }}</b> HBAR</span
              >
            </div>
          </div>
        </div>

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
              v-on:keyup.enter="sendPayment"
            />
          </label>
        </div>
        <div class="button-group">
          <button class="outline" @click="onBackClick()">Back</button>
          <button @click="sendPayment" class="primary" :disabled="!password">
            Approve
          </button>
        </div>
      </div>
      <notifications
        group="notify"
        width="250"
        :max="4"
        class="notifiaction-container"
      />
    </main>
  </div>
</template>

<script>
import { mapState } from "vuex";
import BigNumber from "bignumber.js";
import {
  decryptKeystore,
  getKabutoLink,
  validateAccountID,
  constructClient,
} from "../../../services/AccountService";
import account from "../../mixins/account";
import helper from "../../mixins/helper";
import { AccountId } from "@hashgraph/sdk";
import { sendHbar, sendToken } from "../../../services/HederaService";

export default {
  name: "send",
  mixins: [account, helper],

  props: {
    isToken: {
      type: Boolean,
      default: false,
    },
    token: {
      type: Object,
    },
  },
  data: () => ({
    scene: 1,
    amount: 0,
    tokenList: [],
    recipient: "",
    recipientID: false,
    memo: "",
    inputData: "",
    selectedToken: { tokenId: "HBAR", decimals: 128, isMainToken: true },
    password: "",
    message: {
      show: false,
      type: "error",
      text: "",
    },
  }),

  computed: {
    ...mapState({
      wallet: (state) => state.wallets.active,
      loading: (state) => state.loading,
      currentNetwork: (state) => state.network,
      tokens: (state) => state.account.tokens,
    }),
    getFromAccount() {
      return this.wallet.account;
    },
    isCustomToken() {
      return this.selectedToken && !this.selectedToken.isMainToken;
    },
    getTxFee() {
      return parseFloat("0.01");
    },
    getTotal() {
      if (!this.isCustomToken)
        return new BigNumber(this.amount).plus(this.getTxFee);
      else return this.amount;
    },
    getHbarBalance() {
      return new BigNumber(this.account.balance);
    },
    getMaxBalance() {
      let max;
      if (!this.isCustomToken)
        max = new BigNumber(this.account.balance).minus(this.getTxFee);
      else {
        max = new BigNumber(this.selectedToken.balance).dividedBy(
          new BigNumber(10).pow(new BigNumber(this.selectedToken.decimals))
        );
      }
      if (max === undefined || max < 0) return Number(0);
      return max;
    },
    getHeaderName() {
      if (this.isCustomToken) return `Send ${this.selectedToken.tokenId}`;
      return "Send HBAR";
    },
    getRoute() {
      if (this.isToken) {
        return "/tokens";
      } else {
        return "/home";
      }
    },
  },

  updated() {
    if (this.scene == 2) {
      this.$refs.password.focus();
    }
  },
  watch: {
    amount() {
      if (
        !RegExp(
          `^[0-9]*[.]?[0-9]{0,${Math.min(8, this.selectedToken.decimals)}}$`,
          "g"
        ).test(this.amount)
      )
        this.amount = this.amount.slice(0, this.amount.length - 1);
    },
  },
  methods: {
    setMaxBalance(e) {
      e.preventDefault();
      this.amount = this.getMaxBalance;
    },
    initSelectedToken() {
      if (!this.isToken) {
        this.tokenList = [
          { tokenId: "HBAR", decimals: 128, isMainToken: true },
          ...this.tokens,
        ];
        this.selectedToken = this.tokenList[0];
      } else {
        this.selectedToken = _.find(this.tokens, [
          `tokenId`,
          this.token.tokenId,
        ]);
      }
    },
    onMessageClick() {
      if (this.message.type == "success") window.open(this.message.text);
    },
    onBackClick() {
      this.scene = 1;
      this.password = "";
    },
    initScene() {
      this.scene = 1;
      this.amount = 0;
      this.recipient = "";
      this.password = "";
    },
    async sendPayment() {
      if (!this.password) return;
      let privateKey = await decryptKeystore(
        this.wallet.keystore,
        this.password
      );
      if (!privateKey) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Incorrect password",
        });
        return false;
      }
      this.$store.commit("loading", true);
      try {
        let txReceipt;
        if (!this.isCustomToken) {
          let senderAcc = AccountId.fromString(this.wallet.account);
          let client = await constructClient(
            senderAcc,
            privateKey,
            this.currentNetwork.name
          );
          if (this.memo === "") {
            txReceipt = await sendHbar(this.recipientID, client, this.amount);
          } else {
            txReceipt = await sendHbar(
              this.recipientID,
              client,
              this.amount,
              this.memo
            );
          }
        } else {
          //token transfer part
          let senderAcc = AccountId.fromString(this.wallet.account);
          let client = await constructClient(
            senderAcc,
            privateKey,
            this.currentNetwork.name
          );
          if (this.memo === "") {
            txReceipt = await sendToken(
              this.selectedToken.tokenId,
              this.recipientID,
              client,
              this.amount * Math.pow(10, this.selectedToken.decimals)
            );
          } else {
            txReceipt = await sendToken(
              this.selectedToken.tokenId,
              this.recipientID,
              client,
              this.amount * Math.pow(10, this.selectedToken.decimals),
              this.memo
            );
          }
        }
        this.$store.commit("loading", false);
        if (txReceipt.status.toString() === "SUCCESS") {
          this.showSuccessMsg(
            getKabutoLink(this.wallet.account, this.currentNetwork.name)
          );
        } else {
          this.showErrMessage("Transaction failed");
        }
        this.initScene();
        await this.refreshAccount();
        await this.initSelectedToken();
      } catch (e) {
        console.error(e);
        this.$store.commit("loading", false);
        this.initScene();
        this.showErrMessage(e);
      }
    },
    showSuccessMsg(msg) {
      this.message.show = true;
      this.message.type = "success";
      this.message.text = msg;
    },
    showErrMessage(err) {
      this.message.show = true;
      this.message.type = "error";
      this.message.text = err;
    },
    async showConfirmDialog() {
      this.message.show = false;
      let recipientID = await validateAccountID(this.recipient);
      if (!recipientID) {
        this.showErrMessage("Invalid recipient account ID");
        return false;
      } else {
        this.recipientID = recipientID;
      }

      if (!this.selectedToken) {
        this.showErrMessage("Please select token that you want to send");
        return false;
      }

      if (this.amount <= 0) {
        this.showErrMessage("Invalid token amount");
        return false;
      } else {
        const minAmount = 1 / Math.pow(10, this.selectedToken.decimals);
        if (new BigNumber(this.amount).isLessThan(new BigNumber(minAmount))) {
          this.showErrMessage(
            `Minimum send amount is ${minAmount} ${this.selectedToken.tokenId}`
          );
          return false;
        }
      }

      if (!this.isCustomToken) {
        if (
          new BigNumber(this.getTotal).isGreaterThan(
            new BigNumber(this.getHbarBalance)
          )
        ) {
          this.showErrMessage("Insufficient HBAR balance");
          return false;
        }
      } else {
        if (
          new BigNumber(this.getHbarBalance).isLessThan(
            new BigNumber(this.getTxFee)
          )
        ) {
          this.showErrMessage("Insufficient HBAR balance");
          return false;
        }
        if (
          new BigNumber(this.getTotal).isGreaterThan(
            new BigNumber(this.getMaxBalance),
            10
          )
        ) {
          this.showErrMessage("Insufficient token balance");
          return false;
        }
      }
      this.amount = new BigNumber(this.amount)
        .decimalPlaces(
          Number(this.selectedToken.decimals),
          BigNumber.ROUND_HALF_DOWN
        )
        .toFixed();
      this.scene = 2;
    },

    async refreshData() {
      this.message.show = false;
      this.$store.commit("loading", true);
      await this.refreshAccount();
      await this.initSelectedToken();
      this.$store.commit("loading", false);
    },
  },
};
</script>
<style scoped>
h3 {
  margin-top: 0px;
}
.recipient {
  width: 100%;
}
.amount {
  width: 67%;
}
.token {
  width: 33%;
}
.input-data {
  height: 100px;
}
.password-content {
  margin-bottom: 10px;
}
.center {
  text-align: center;
}
.maximum-label {
  color: #2d84eb;
  font-size: 12px;
  margin-top: 3px;
  margin-left: 5px;
}
.gray {
  color: #bbb;
}

.invoice-content {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  font-size: 14px;
}
</style>
