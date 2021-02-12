<template>
  <div>
    <app-header subtitle="Associate Token" backRoute="/tokens" />
    <main class="main">
      <div class="main-logo">
        <img src="images/hedera.png" alt="Hedera" />
      </div>
      <div class="addtoken-header">
        <h4>Associate token to {{ this.wallet.name }}</h4>
      </div>
      <label class="input-label">
        Token ID
        <input
          class="input-field"
          type="text"
          name="newTokenId"
          ref="newTokenId"
          v-model="newTokenId"
          placeholder="Input the token ID"
        />
      </label>
      <div class="button-group">
        <button class="outline" @click="$router.go(-1)">Back</button>
        <button class="primary" @click="associateToken" :disabled="!newTokenId">
          Associate
        </button>
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
import { validateTokenID } from "../../../services/AccountService";
import { associateTokenWithAccount } from "../../../services/HederaService";

export default {
  data: () => ({
    newTokenId: "",
  }),
  computed: {
    ...mapState({
      wallet: (state) => state.wallets.active,
    }),
  },
  methods: {
    async associateToken() {
      let tokenId = await validateTokenID(this.newTokenId);
      if (!tokenId) {
        this.$notify({
          group: "notify",
          type: "error",
          text: "Invalid token ID",
        });
        return;
      }
      this.$store.commit("loading", true);
      try {
        await associateTokenWithAccount(
          tokenId,
          this.wallet.account,
          this.wallet.key,
          this.wallet.network
        );
        this.$store.commit("loading", false);
        this.$notify({
          group: "notify",
          type: "info",
          text: `Token ${tokenId} successfully associated to ${this.wallet.name}`,
        });
      } catch (err) {
        this.$store.commit("loading", false);
        this.$notify({
          group: "notify",
          type: "error",
          text: err,
        });
        console.error(err);
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.addtoken-header {
  text-align: center;
}
.label-header {
  display: flex;
  span {
    margin-right: 5px;
  }
}
</style>
