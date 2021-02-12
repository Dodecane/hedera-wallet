<template>
  <div>
    <app-header
      @refresh="loadHbarBalance"
      @networkChanged="loadHbarBalance"
      headerTab="main-tab"
    />
    <main class="main">
      <div class="relative">
        <div class="main-logo">
          <img src="images/hedera-big.png" class="logo-img" alt="Hedera" />
        </div>
      </div>
      <div class="container">
        <div
          class="account-box"
          @click="onClickAccount()"
          v-tooltip.top="'Click to copy account ID'"
        >
          <h2 class="name-label">{{ compressName(wallets.active.name) }}</h2>
          <div class="box-address">
            {{ compressName(wallets.active.account) }}
          </div>
        </div>

        <div class="box-label">Account Balance</div>

        <div class="box-balance">
          {{ account.balance }}
          <span class="box-balance-code">HBAR</span>
        </div>
        <div class="box-usd-balance">
          <span v-if="!tokenPrice">---</span>
          <span v-else>≈ {{ getUSDBalance }}</span>
          <span class="box-usd-balance-code">USD</span>
        </div>

        <div class="button-group">
          <button
            class="outline"
            @click="$router.push('/deposit')"
            v-tooltip.top="'Deposit token'"
          >
            Deposit
          </button>
          <button
            class="primary"
            @click="onSendClick"
            v-tooltip.top="'Send token'"
          >
            Send
          </button>
        </div>
        <div class="divider"></div>
        <div class="footer price-bar" v-if="tokenPrice">
          <marquee-text :duration="20">
            <span class="token-symbol-indicator">HBAR:</span>
            <span class="token-price-indicator"
              >{{ tokenPrice["hbar"] }} USD</span
            >
            <span class="token-symbol-indicator">BTC:</span>
            <span class="token-price-indicator"
              >{{ tokenPrice["btc"] }} USD</span
            >
            <span class="token-symbol-indicator">ETH:</span>
            <span class="token-price-indicator"
              >{{ tokenPrice["eth"] }} USD</span
            >
          </marquee-text>
        </div>
      </div>
      <notifications
        group="copied"
        width="180"
        :max="2"
        class="notifiaction-container"
      />
    </main>
  </div>
</template>

<script>
import helper from "mixins/helper";
import account from "mixins/account";
import MainTab from "components/MainTab.vue";
import { mapState } from "vuex";
import BigNumber from "bignumber.js";

import axios from "axios";

export default {
  mixins: [account, helper],

  components: {
    MainTab,
  },

  data: () => ({
    tokenPrice: null,
  }),

  computed: {
    ...mapState(["wallets"]),
    getUSDBalance() {
      return new BigNumber(this.account.balance)
        .multipliedBy(this.tokenPrice["hbar"])
        .toFixed(2);
    },
  },

  mounted() {
    this.fetchTokenPrice();
    //this.loadHbarBalance();
    //this.loadTokens();
  },

  methods: {
    async fetchTokenPrice() {
      const {
        data: {
          bitcoin: { usd: btcUSD },
          ethereum: { usd: ethUSD },
          "hedera-hashgraph": { usd: hbarUSD },
        },
      } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,hedera-hashgraph&vs_currencies=usd"
      );
      this.tokenPrice = { btc: btcUSD, eth: ethUSD, hbar: hbarUSD };
      setTimeout(this.fetchTokenPrice, 30000);
    },
    onSendClick() {
      this.$router.push("/send");
    },
    onClickAccount() {
      this.$copyText(this.wallets.active.account).then(() => {
        this.$notify({
          group: "copied",
          type: "info",
          text: "Copied to Clipboard",
        });
      });
    },
    compressName(str) {
      if (str.length > 15)
        return (
          str.substr(0, 10) + "..." + str.substr(str.length - 5, str.length)
        );
      return str;
    },
  },
};
</script>
<style scoped>
.container {
  text-align: center;
}
.name-label {
  margin: 0.5rem;
}
.account-box {
  border-radius: 10px;
  padding: 0.5rem;
  margin: 0 3rem 0.5rem 3rem;
  word-wrap: break-word;
  transition: box-shadow 0.5s ease;
}
.account-box:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}
.account-box:active {
  background: #f0f0f0;
}
.toast-container {
  border-radius: 5px;
  max-width: 200px;
}
.logo-img {
  height: 50px;
  width: 50px;
}
.account-badge {
  position: absolute;
  right: 10px;
  top: 5px;
}
.relative {
  position: relative;
  z-index: -1;
}
.price-bar {
  left: 0;
  right: 0;
  font-size: 14px;
  opacity: 1;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 2s;
}

.token-symbol-indicator {
  color: black;
}

.token-price-indicator {
  font-weight: 600;
  margin-right: 2rem;
}
@keyframes fadeInOpacity {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
