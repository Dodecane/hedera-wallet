<template>
  <div>
    <app-header
      @refresh="loadTokens"
      @networkChanged="loadTokens"
      headerTab="main-tab"
    />
    <main class="main" :style="{ 'padding-right': '0px' }">
      <div class="token-header">
        <span class="hide-label">Hide low balances</span>
        <toggle-button
          :value="hideLowBalance"
          color="#8259EF"
          :sync="true"
          :labels="false"
          @change="onChangeHideButton"
        />
      </div>
      <div class="token-container">
        <div v-if="!filteredTokens.length" class="message-empty">
          No tokens found
        </div>

        <div v-else>
          <div
            class="token-row"
            v-for="(token, index) in filteredTokens"
            :key="index"
          >
            <span class="token-name">{{ compressSymbol(token.tokenId) }}</span>
            <div>
              <div class="token-box">
                <span class="token-balance">
                  {{ formatBalance(token.balance, token.decimals) }}
                </span>
                <button
                  class="token_send_but"
                  :disabled="token.balance <= 0"
                  @click="sendToken(token)"
                  v-tooltip.top="'Send token'"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="token-button-footer">
          <div class="token-button-group">
            <button
              class="round"
              @click="$router.push('/associate-token')"
              v-tooltip.top="'Associate token'"
            >
              <i class="material-icons">add</i>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import account from "mixins/account";
import helper from "mixins/helper";
import { mapState } from "vuex";
import BigNumber from "bignumber.js";
import _ from "lodash";
export default {
  mixins: [account, helper],
  computed: {
    ...mapState({
      hideLowBalance: (state) => state.settings.hideLowBalance,
      tokens: (state) => state.account.tokens,
    }),
    filteredTokens() {
      if (this.hideLowBalance)
        return _.filter(this.tokens, (item) =>
          new BigNumber(item.balance).isGreaterThan(0)
        );
      return this.tokens;
    },
  },
  mounted() {
    this.$forceUpdate();
  },
  methods: {
    onChangeHideButton(e) {
      this.$store.commit("settings/setHideLowBalance", e.value);
    },
    compressSymbol(str) {
      if (str.length > 15)
        return (
          str.substr(0, 8) + "..." + str.substr(str.length - 5, str.length)
        );
      return str;
    },
    sendToken(token) {
      this.$router.push(`/send-token/${token.tokenId}`);
    },
  },
};
</script>

<style lang="scss" scoped>
.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: #f9f9f9;
  border-radius: 5px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}
.token-box,
.token span {
  display: block;
}
.token-name {
  color: black;
  font-size: 1rem;
  max-width: 120px;
  min-width: 60px;
  overflow: hidden;
}
.token-balance {
  font-size: 1rem;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
  padding-left: 1rem;
}
.hide-label {
  font-size: 14px;
  margin-right: 0.5rem;
}
.token-header {
  margin-bottom: 1rem;
}
button.token_send_but {
  border-radius: 5px;
  color: white;
  text-align: center;
  font-size: 1rem;
  font-weight: 400;
  min-width: 60px;
  white-space: nowrap;
  outline: none;
  width: 60px;
  background: #8259ef;
  border: 1px solid #8259ef;
  transition: 0.5s;
  &:hover:enabled {
    box-shadow: 0 2px 6px rgba(22, 22, 22, 0.3);
    background-color: #2d84eb;
    cursor: pointer;
  }
  &:active:enabled {
    background-color: #412c78;
  }
  &:disabled {
    cursor: default;
    color: #8c8c8c;
    background: white;
    border: 1px solid #ddd;
  }
}

.token-container {
  padding-right: 1rem;
  overflow: auto;
  height: calc(100% - 85px);
}
.token-button-group {
  display: flex;
  gap: 10px;
}
.token-button-footer {
  position: absolute;
  right: 20px;
  bottom: 10px;
}
</style>
