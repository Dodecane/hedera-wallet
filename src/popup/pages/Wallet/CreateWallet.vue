<template>
  <div>
    <app-header headerTab="create-tab" />
    <main class="main">
      <div class="main-logo" v-if="scene === 1 || scene === 4">
        <img src="images/hedera.png" alt="Hedera" />
      </div>
      <div v-if="scene === 1">
        <label class="input-label account-name">
          Account Name
          <input
            class="input-field"
            type="text"
            name="name"
            ref="name"
            v-model="name"
            placeholder="Input the account name"
            v-on:keyup.enter="createName"
          />
        </label>

        <div class="button-group">
          <button
            v-show="wallets.accounts.length > 0"
            class="outline"
            @click="$router.push('/home')"
          >
            Cancel
          </button>
          <button
            @click="createName"
            class="primary"
            :class="!wallets.accounts.length ? 'flex' : ''"
            :disabled="!name"
          >
            Create
          </button>
        </div>
      </div>
      <div v-else-if="scene === 2">
        <div class="receive-payment">
          <div>
            Provide your public key (this QR code or the copied text) to an
            existing account owner on the Hedera network. They must create and
            fund your account, then provide you with your new account ID.
          </div>
          <div v-if="currentNetwork.name === 'network.testnet'">
            Alternatively you may visit
            <a
              href="https://hedera-wallet-playground.web.app/#/faucet"
              target="_blank"
              >Hedera Wallet Playground Faucet</a
            >
            to obtain an account ID.
          </div>
          <div class="input-group">
            <input
              class="input-field"
              type="text"
              name="publicKey"
              v-model="publicKey"
              :style="{ 'z-index': 10 }"
              readonly
            />
            <button title="Copy to clipboard" @click="copyPublicKeyToClipboard">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                class="icon"
              >
                <path
                  d="M6 6V2c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V8c0-1.1.9-2 2-2h4zm2 0h4a2 2 0 0 1 2 2v4h4V2H8v4zM2 8v10h10V8H2z"
                />
              </svg>
            </button>
          </div>
          <vue-qr :text="publicKey" :size="336"></vue-qr>
        </div>
        <label class="input-label">
          Account ID
          <input
            class="input-field"
            type="text"
            name="accountID"
            ref="accountID"
            v-model="accountID"
            placeholder="Input the account ID (0.0.XXXXXX) obtained from above"
          />
        </label>
        <label class="input-label">
          Password
          <input
            class="input-field"
            type="password"
            name="password"
            ref="password"
            v-model="password"
            placeholder="Input the password"
          />
        </label>
        <label class="input-label">
          Confirm the password
          <input
            class="input-field"
            type="password"
            name="password_confirm"
            ref="password_confirm"
            v-model="password_confirm"
            placeholder="Confirm the password"
          />
        </label>
        <label class="input-label">
          Seed Phrase
          <a class="copy-tag" @click.prevent="copySeedPhraseToClipboard"
            >(Click here to copy)</a
          >
          <textarea
            class="input-field"
            name="seed_phrase"
            ref="seed_phrase"
            v-model="seed_phrase"
            placeholder="Seed Phrase"
          />
        </label>
        <input type="checkbox" id="seedcheck" :value="agree" v-model="agree" />
        <label class="check-label" for="seedcheck"
          >I understand that lost seed phrases cannot be recovered.</label
        >
        <div class="button-group">
          <button class="outline" @click="() => (scene = 1)">Back</button>
          <button class="primary" @click="confirmPassword" :disabled="!agree">
            Next
          </button>
        </div>
      </div>
      <div v-else-if="scene === 3">
        <seed-checker
          :phrase="seed_phrase.toString()"
          :confirm="() => (scene = 4)"
        />
      </div>
      <div v-else>
        <pincode-modal @success="addAccount" :onBack="() => (scene = 3)" />
      </div>
      <notifications
        group="notify"
        width="250"
        :max="2"
        class="notifiaction-container"
      />
    </main>
  </div>
</template>

<script>
import account from "mixins/account";
import {
  generatePhrase,
  createAccountFromMnemonic,
} from "../../../services/AccountService";
import { mapState } from "vuex";
import { PrivateKey } from "@hashgraph/sdk";
import VueQr from "vue-qr";

export default {
  mixins: [account],
  components: {
    VueQr,
  },
  data: () => ({
    name: "",
    password: "",
    agree: false,
    password_confirm: "",
    seed_phrase: "",
    scene: 1,
    wallet: null,
    accountID: "",
    publicKey: "",
  }),
  computed: {
    ...mapState({
      wallets: (state) => state.wallets,
      currentNetwork: (state) => state.network,
    }),
  },
  methods: {
    addAccount() {
      this.$store.commit("wallets/addAccount", {
        ...this.wallet,
      });
      alert(
        "Your account is created successfully. To continue, close this tab and use the extension."
      );
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id, function() {});
      });
    },
    async confirmPassword() {
      if (this.password.length < 8) {
        this.$notify({
          group: "notify",
          type: "warn",
          text: "Password must be longer than 8 characters",
        });
        return;
      } else if (this.password !== this.password_confirm) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Password doesn't match",
        });
        return;
      }
      this.wallet = await createAccountFromMnemonic(
        this.name,
        this.seed_phrase.toString(),
        this.password,
        this.accountID,
        this.currentNetwork.name
      );
      if (!this.wallet) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Account ID does not match provided mnemonic",
        });
        return;
      }
      this.scene = 3;
    },
    copySeedPhraseToClipboard() {
      this.$copyText(this.seed_phrase).then(() => {
        this.$notify({
          group: "notify",
          type: "info",
          text: "Copied to Clipboard",
        });
      });
    },
    copyPublicKeyToClipboard() {
      this.$copyText(this.publicKey).then(() => {
        this.$notify({
          group: "notify",
          type: "info",
          text: "Copied to Clipboard",
        });
      });
    },
    async createName() {
      if (this.name === "") {
        this.$notify({
          group: "notify",
          text: "Invalid name",
        });
        return;
      }
      this.seed_phrase = await generatePhrase();
      this.publicKey = await (
        await PrivateKey.fromMnemonic(this.seed_phrase)
      ).publicKey.toString();
      this.scene = 2;
    },
  },
};
</script>

<style scoped>
.button-group {
  margin-top: 30px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
}
.error {
  color: #ff4200;
  font-size: 10px;
  margin-top: 5px;
}
.account-name {
  font-size: 1rem;
  color: black;
  margin-bottom: 30px !important;
}
.account-name > input {
  margin-top: 15px !important;
}
.copy-tag {
  color: #2d84eb;
}
.check-label {
  font-size: 1rem;
  margin: 0.75rem 0 1rem;
  color: #222222;
  cursor: pointer;
}
.input-field {
  resize: none;
}
</style>
