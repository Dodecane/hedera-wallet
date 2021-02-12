<script>
import { mapState } from "vuex";
import helper from "mixins/helper";
import { getKabutoLink } from "../../services/AccountService";

export default {
  mixins: [helper],

  computed: mapState({
    account: (state) => state.wallets.active.account,
    currentNetwork: (state) => state.network,
  }),

  created() {
    this.openExternalURL(getKabutoLink(this.account, this.currentNetwork.name));
    this.$router.push("/home");
  },
};
</script>
