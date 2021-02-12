export default {
  namespaced: true,

  state: {
    balance: 0,
    tokens: [],
  },

  mutations: {
    balance(state, balance) {
      state.balance = balance;
    },
    tokens(state, tokens) {
      state.tokens = tokens;
    },
  },
};
