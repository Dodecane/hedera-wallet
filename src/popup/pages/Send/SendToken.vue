<template>
  <div>
    <send-transaction :isToken="true" :token="token"></send-transaction>
  </div>
</template>

<script>
import { mapState } from "vuex";
import account from "../../mixins/account";
import SendTransaction from "./SendTransaction";
import _ from "lodash";
import { TokenId } from "@hashgraph/sdk";
export default {
  name: "send-token",
  mixins: [account],
  data: () => ({
    token: {
      type: Boolean | Object,
      default: false,
    },
  }),
  components: {
    SendTransaction,
  },
  computed: {
    ...mapState({
      tokens: (state) => state.account.tokens,
    }),
  },
  async mounted() {
    const tokenId = this.$route.params.tokenId;
    await this.loadTokens();
    this.token = _.find(this.tokens, [`tokenId`, TokenId.fromString(tokenId)]);
  },
};
</script>
