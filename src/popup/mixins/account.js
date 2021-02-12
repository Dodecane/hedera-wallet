import { mapState } from "vuex";
import { getBalance, getTokens } from "../../services/HederaService";
import { HbarUnit } from "@hashgraph/sdk";
export default {
  computed: mapState({
    account: (state) => state.account,
    activeWallet: (state) => state.wallets.active,
    currentNetwork: (state) => state.network,
  }),

  methods: {
    async loadHbarBalance() {
      this.$store.commit("loading", true);
      let result = await getBalance(
        this.activeWallet.account,
        this.activeWallet.key,
        this.currentNetwork.name
      );
      this.$store.commit("account/balance", result.to(HbarUnit.Hbar));
      this.$store.commit("loading", false);
    },

    async loadTokens() {
      this.$store.commit("loading", true);
      let result = await getTokens(
        this.activeWallet.account,
        this.activeWallet.key,
        this.currentNetwork.name
      );
      this.$store.commit("account/tokens", result);
      this.$store.commit("loading", false);
    },

    async refreshAccount() {
      this.$store.commit("loading", true);
      await this.loadHbarBalance();
      await this.loadTokens();
      this.$store.commit("loading", false);
    },
  },
};
