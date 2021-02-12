export default {
  namespaced: true,

  state: {
    proxy: "",
    address: "",
    node: { shard: 0, realm: 0, node: 0 },
    name: "",
  },

  mutations: {
    change(state, network) {
      state.proxy = network.proxy;
      state.address = network.address;
      state.node = network.node;
      state.name = network.name;
    },
  },
};
