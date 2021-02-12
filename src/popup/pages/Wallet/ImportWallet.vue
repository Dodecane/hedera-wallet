<template>
  <div>
    <app-header headerTab="create-tab" />
    <main class="main">
      <div class="main-logo">
        <img
          v-if="scene === 1 || scene === 3"
          src="images/hedera.png"
          alt="Hedera"
          :class="{ 'logo-md': selectType === 'keystore' && scene === 2 }"
        />
      </div>
      <div v-if="scene === 1">
        <div class="type-row">
          <div class="row-label">Select Type</div>
          <select class="input-field type-select" v-model="selectType">
            <option value="key">Private Key</option>
            <option value="mnemonic">Mnemonic</option>
            <!--
            <option value="keystore">Keystore File</option>
            -->
          </select>
        </div>
        <div v-if="selectType !== 'keystore'">
          <div v-if="selectType === 'key'">
            <label class="input-label big-label">
              Paste your private Key
              <input
                class="input-field"
                type="password"
                name="priavtekey"
                ref="priavtekey"
                v-model="privateKey"
                placeholder="Input the private key"
                v-on:keyup.enter="importKey"
              />
            </label>
          </div>
          <div v-else>
            <label class="input-label">
              Paste your Mnemonic
              <textarea
                class="input-field"
                name="mnemonic"
                ref="mnemonic"
                v-model="mnemonic"
                placeholder="Input the Mnemonic"
              />
            </label>
          </div>
        </div>
        <div v-else class="file-row">
          <input type="file" class="file-field" @change="onSelectFile" />
        </div>

        <div class="button-group">
          <button
            v-show="wallets.accounts.length > 0"
            class="outline"
            @click="$router.push('/home')"
          >
            Cancel
          </button>
          <button
            class="primary"
            @click="importKey"
            :class="!wallets.accounts.length ? 'flex' : ''"
          >
            Import
          </button>
        </div>
      </div>
      <div v-else-if="scene === 2">
        <label class="input-label">
          Account Name
          <input
            class="input-field"
            type="text"
            name="name"
            ref="name"
            v-model="name"
            placeholder="Input the account name"
          />
        </label>
        <label class="input-label">
          Account ID
          <input
            class="input-field"
            type="text"
            name="accountID"
            ref="accountID"
            v-model="accountID"
            placeholder="Input the account ID (0.0.XXXXXX)"
          />
        </label>
        <div v-if="selectType === 'keystore'">
          <label class="input-label">
            Enter the keystore file password
            <input
              class="input-field"
              type="password"
              name="keystorepass"
              ref="keystorepass"
              v-model="keystorepass"
              placeholder="Enter the keystore file password"
            />
          </label>
        </div>
        <label class="input-label">
          <span v-if="selectType !== 'keystore'">Password</span>
          <span v-else>Enter your account password</span>
          <input
            class="input-field"
            type="password"
            name="password"
            ref="password"
            v-model="password"
            :placeholder="
              selectType !== 'keystore'
                ? 'Input the password'
                : 'Enter your account password'
            "
          />
        </label>
        <div>
          <label class="input-label">
            Confirm the password
            <input
              class="input-field"
              type="password"
              name="password_confirm"
              ref="password_confirm"
              v-model="password_confirm"
              placeholder="Confirm the password"
              v-on:keyup.enter="importAcc"
            />
          </label>
        </div>
        <div class="button-group">
          <button class="outline" @click="() => (scene = 1)">Back</button>
          <button
            class="primary"
            @click="importAcc"
            :disabled="!name || !password"
          >
            Next
          </button>
        </div>
      </div>
      <div v-else>
        <pincode-modal @success="addAcc" :onBack="() => (scene = 2)" />
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
import { mapState } from "vuex";
import _ from "lodash";
import {
  validatePrivateKey,
  validateMnemonic,
  validateAccountID,
  createAccountFromPrivateKey,
  createAccountFromMnemonic,
  createAccountFromKeystore,
} from "../../../services/AccountService";

export default {
  data: () => ({
    name: "",
    accountID: "",
    password: "",
    keystorepass: "",
    password_confirm: "",
    privateKey: "",
    keyFromFile: "",
    mnemonic: "",
    scene: 1,
    selectType: "key",
    file: null,
    wallet: null,
  }),
  computed: {
    ...mapState({
      wallets: (state) => state.wallets,
      currentNetwork: (state) => state.network,
    }),
  },

  methods: {
    onSelectFile(event) {
      this.file = event.target.files[0];
    },
    async importKey() {
      if (this.selectType === "key") {
        if (!(await validatePrivateKey(this.privateKey))) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Please enter a valid private key",
          });
          return false;
        }
      }
      if (this.selectType === "mnemonic") {
        if (!validateMnemonic(this.mnemonic)) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Please enter a valid mnemonic",
          });
          return false;
        }
      }
      if (this.selectType === "keystore") {
        if (!this.file) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Please select a file",
          });
          return false;
        } else {
          const _this = this;
          this.keystoreBytes = new Uint8Array(
            await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.addEventListener("error", () => {
                _this.$notify({
                  group: "notify",
                  type: "error",
                  text: "Keystore file invalid",
                });
                reject();
              });
              reader.addEventListener("loadend", () => {
                resolve(reader.result);
              });
              reader.readAsArrayBuffer(this.file);
            })
          );
        }
      }
      this.scene = 2;
    },
    addAcc() {
      this.$store.commit("wallets/addAccount", this.wallet);
      alert(
        "Your account is imported successfully. To continue, close this tab and use the extension."
      );
      chrome.tabs.getCurrent(function(tab) {
        chrome.tabs.remove(tab.id, function() {});
      });
    },
    async importAcc() {
      if (!this.password) {
        this.$notify({
          group: "notify",
          text: "Password is required",
        });
        return false;
      }
      if (!this.name) {
        this.$notify({
          group: "notify",
          text: "Account name is required",
        });
        return false;
      }
      if (!this.accountID) {
        this.$notify({
          group: "notify",
          text: "Account ID is required",
        });
        return false;
      }
      if (!(await validateAccountID(this.accountID))) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Account ID is invalid",
        });
        return false;
      }
      if (this.password.length < 8) {
        this.$notify({
          group: "notify",
          type: "warn",
          text: "Password must be longer than 8 characters",
        });
        return false;
      } else if (this.password !== this.password_confirm) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Password doesn't match",
        });
        return false;
      }

      if (this.selectType === "key") {
        this.wallet = await createAccountFromPrivateKey(
          this.name,
          this.privateKey,
          this.password,
          this.accountID,
          this.currentNetwork.name
        );
        if (!this.wallet) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Account ID does not match provided key",
          });
          return false;
        }
      } else if (this.selectType == "mnemonic") {
        this.wallet = await createAccountFromMnemonic(
          this.name,
          this.mnemonic,
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
          return false;
        }
      } else {
        this.wallet = await createAccountFromKeystore(
          this.name,
          this.keystoreBytes,
          this.keystorepass,
          this.password,
          this.accountID,
          this.currentNetwork.name
        );
        if (!this.wallet) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Keystore password is incorrect or file is invalid",
          });
          return false;
        } else if (this.wallet === 1) {
          this.$notify({
            group: "notify",
            type: "error",
            text: "Account ID does not match provided keystore file",
          });
          return false;
        }
      }
      const acc = _.find(this.wallets.accounts, {
        address: this.wallet.address,
      });
      if (acc) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Account already exists",
        });
        return false;
      }
      this.scene = 3;
    },
  },
};
</script>
<style scoped>
.type-row {
  display: flex;
  justify-content: space-between;
}
.row-label {
  width: 35%;
  margin: auto;
  color: black;
  justify-content: center;
}
.type-select {
  width: 65%;
}
.file-field {
  margin-top: 1rem;
  margin-bottom: 1rem;
  width: 300px;
}
.file-row {
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
}
.big-label {
  font-size: 1rem;
  color: black;
}
</style>
