import {
  HEDERA_REQUEST_TYPE,
  HEDERA_RESPONSE_TYPE,
  HEDERAWALLET_SERVICE_EVENT_REQUEST,
  HEDERAWALLET_SERVICE_EVENT_RESPONSE,
  GET_TAB_ID_INNER_EVENT_REQUEST,
  POPUP_CLOSED,
} from "~/types";

window.onerror = function(message, error) {
  console.error(
    "Hedera Wallet service call failed,",
    message,
    ", error: ",
    error
  );
};

let currentTabId = null;
let pendingRequests = 0;
chrome.runtime.sendMessage(
  { action: GET_TAB_ID_INNER_EVENT_REQUEST },
  (tabId) => {
    currentTabId = tabId;
    injectScript();
  }
);

// Content script
window.addEventListener(
  HEDERAWALLET_SERVICE_EVENT_REQUEST,
  function(event) {
    const exec = () => {
      if (
        !event.detail ||
        !event.detail.type ||
        event.detail.type !== HEDERA_REQUEST_TYPE
      ) {
        return;
      }

      const { payload } = event.detail;

      chrome.runtime.sendMessage(
        {
          payload,
          messageSource: HEDERA_REQUEST_TYPE,
        },
        (res) => {
          if (res && res.isLocked) {
            setTimeout(exec, 500);
            return;
          }

          pendingRequests++;
        }
      );
    };

    exec();
  },
  false
);

// Listen message from extension background page/popup and re-send to current window (dashboard page)
chrome.runtime.onMessage.addListener(async (message) => {
  if (!message || !message.type || message.type !== HEDERA_RESPONSE_TYPE) {
    return false;
  }

  if (pendingRequests <= 0 && message.message.type === POPUP_CLOSED) {
    return false;
  }

  if (!currentTabId || currentTabId !== message.message.payload.sender) {
    return false;
  }
  delete message.message.payload.sender;

  window.dispatchEvent(
    new CustomEvent(HEDERAWALLET_SERVICE_EVENT_RESPONSE, {
      detail: message,
    })
  );

  pendingRequests--;
  return true;
});

const injectScript = () => {
  try {
    const node = document.head || document.documentElement;
    const script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", chrome.extension.getURL("inject-script.js"));
    node.appendChild(script);
    console.info("Hedera Wallet provider injected");
    const event = new Event("hederaWalletInjected");
    document.dispatchEvent(event);
  } catch (e) {
    console.error("Hedera Wallet provider injection failed", e);
  }
};
