import _ from "lodash";
export default {
  namespaced: true,

  state: {
    active: {
      name: "",
      account: false,
      publicKey: false,
      key: false,
      keystore: false,
      network: false,
    },
    accounts: [],
  },

  mutations: {
    addAccount(state, payload) {
      state.accounts.push(payload);
      state.active = payload;
    },

    setActive(state, payload) {
      //set active account when you select the account in the menu
      const acc = _.find(state.accounts, { publicKey: payload });
      state.active = acc;
    },
  },
};
