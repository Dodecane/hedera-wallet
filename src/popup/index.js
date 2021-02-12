import Vue from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import { sync } from "vuex-router-sync";
import vClickOutside from "v-click-outside";
import VueClipboard from "vue-clipboard2";
import VModal from "vue-js-modal";
import Notifications from "vue-notification";
import AppHeader from "./components/AppHeader.vue";
import SeedChecker from "./components/SeedChecker";
import RadioButton from "./components/RadioButton";
import PincodeInput from "vue-pincode-input";
import PincodeModal from "./pages/Settings/Security/PincodeModal.vue";
import MoonLoader from "vue-spinner/src/MoonLoader";
import PulseLoader from "vue-spinner/src/PulseLoader";
import ScaleLoader from "vue-spinner/src/ScaleLoader";
import ClipLoader from "vue-spinner/src/ClipLoader";
import MarqueeText from "vue-marquee-text-component";
import ToggleButton from "vue-js-toggle-button";
import Tooltip from "vue-directive-tooltip";
import "vue-directive-tooltip/dist/vueDirectiveTooltip.css";

import BigNumber from "bignumber.js";

import { availableNetworks } from "../domain/network";

import * as storage from "services/StorageService";
import AppInfo from "~/app.json";

import { CLOSE_WINDOW, FROM_BACK_TO_POPUP } from "~/types";

import "./css/icons.less";
import "./css/normalize.scss";
import "./css/style.scss";
import "./css/modal.scss";
import "./css/vue-select.scss";
import Popper from "vue-popperjs";
import "vue-popperjs/dist/vue-popper.css";

Vue.config.productionTip = false;

sync(store, router);

Vue.use(ToggleButton);
Vue.component("Popper", Popper);
Vue.component("marquee-text", MarqueeText);
Vue.component("MoonLoader", MoonLoader);
Vue.component("PulseLoader", PulseLoader);
Vue.component("ClipLoader", ClipLoader);
Vue.component("ScaleLoader", ScaleLoader);
Vue.component("AppHeader", AppHeader);
Vue.component("SeedChecker", SeedChecker);
Vue.component("PincodeInput", PincodeInput);
Vue.component("RadioButton", RadioButton);
Vue.component("PincodeModal", PincodeModal);
Vue.use(Notifications);
Vue.use(vClickOutside);
Vue.use(VueClipboard);
Vue.use(Tooltip, {
  delay: 1,
});
Vue.use(VModal, {
  dialog: true,
  dynamic: true,
  injectModalsContainer: true,
});

new Vue({
  store,
  router,
  render: (h) => h(App),
}).$mount("#app");

//init the store
if (!store.state.network.name)
  store.commit(
    "network/change",
    availableNetworks[Object.keys(availableNetworks)[0]]
  );
if (!store.state.settings.auth.lockState)
  store.dispatch("settings/setLockState", false);

///

BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  FORMAT: {
    prefix: "",
    decimalSeparator: ".",
    groupSeparator: ",",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: " ",
    fractionGroupSize: 0,
    suffix: "",
  },
});
//change the state

//save the version info
storage.getValue("meta").then(({ meta }) => {
  storage.saveValue({
    meta: {
      ...meta,
      version: AppInfo.version,
    },
  });
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const { type, action } = message;
  if (!type || type !== FROM_BACK_TO_POPUP) {
    return false;
  }
  if (action === CLOSE_WINDOW) {
    window.close();
  }
  sendResponse();
  return true;
});
