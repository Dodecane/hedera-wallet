<template>
  <div class="lock-page">
    <div class="main-logo">
      <img src="images/hedera-wallet-big.png" class="lock-logo" alt="Hedera" />
    </div>
    <div class="title">
      <div class="brand-name">Hedera Wallet</div>
      <div class="version-info">{{ version }}</div>
    </div>
    <div class="unlock-caption">Unlock your wallet</div>
    <div
      class="pin-container"
      :class="{ 'pin-fail': pincodeError ? true : false }"
      :style="{
        'margin-left': getPinMargin(getPinCode.digits),
        'margin-right': getPinMargin(getPinCode.digits),
      }"
    >
      <PincodeInput
        v-model="pin"
        :length="getPinCode.digits"
        :secure="true"
        :characterPreview="false"
        :disabled="!attempts"
        ref="pincodeInput"
      />
    </div>
    <div class="pin-caption" :class="{ 'failed-caption': attempts < 5 }">
      {{ statusCaption }}
    </div>
    <div v-if="lastOpened">
      <div class="lastopen-fromnow-caption">
        Last accessed {{ lastOpenedFromNow }}
      </div>
      <div class="lastopen-time-caption">{{ lastOpened }}</div>
    </div>
    <div id="bubbles"></div>
    <div id="shark">
      <div class="shark-body"></div>
      <div class="shark-eye"></div>
      <div class="aleta"></div>
      <div class="tail"></div>
      <div class="fin"></div>
      <div class="gill gill-1"></div>
      <div class="gill gill-2"></div>
      <div class="gill gill-3"></div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import * as storage from "services/StorageService";
import moment from "moment-timezone";
const AppInfo = require("~/app.json");
export default {
  data: () => ({
    pin: "",
    pincodeError: false,
    lastOpened: "",
    lastOpenedFromNow: "",
  }),
  computed: {
    ...mapGetters(["getPinCode"]),
    ...mapState({
      attempts: (state) => state.settings.auth.attempts,
      countdown: (state) => state.settings.auth.countdown,
    }),
    version() {
      return "v" + AppInfo.version;
    },
    statusCaption() {
      if (this.attempts === 5)
        return `Input the ${this.getPinCode.digits} digits PIN Code`;
      else if (this.attempts > 0)
        return `${this.attempts} ${
          this.attempts > 1 ? "attempts" : "attempt"
        } remaining`;
      else {
        return `Authentication failed. Try again after ${this.formatTime(
          this.countdown
        )}`;
      }
    },
  },
  watch: {
    pin() {
      if (this.pin.length === this.getPinCode.digits) {
        this.pinCodeComplete();
      }
    },
  },
  async created() {
    const { AppState } = await storage.getValue("AppState");
    if (!AppState) return;
    const { lastOpened } = AppState;
    if (lastOpened) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.lastOpened = moment(lastOpened)
        .tz(timezone)
        .format("YYYY/MM/DD HH:mm:ss z");
      this.lastOpenedFromNow = moment(lastOpened).fromNow();
    }
    if (this.attempts === 0) {
      const { lastClosed } = AppState;
      if (lastClosed) {
        const now = Date.now();
        const passedtime = Math.floor((now - lastClosed) / 1000);
        this.$store.commit(
          "settings/setCountdown",
          Math.max(this.countdown - passedtime, 0)
        );
        this.startCountDown();
      }
    }
  },
  methods: {
    getPinMargin(digits) {
      return digits === 4 ? "50px" : "15px";
    },
    startCountDown() {
      const timerID = setInterval(() => {
        const count = this.countdown - 1;
        if (count <= 0) {
          this.$store.commit("settings/resetFailedTimer");
          this.$nextTick(() => this.$refs.pincodeInput.$el.children[0].focus());
          clearInterval(timerID);
        } else this.$store.commit("settings/setCountdown", count);
      }, 1000);
    },
    formatTime(count) {
      return `${String(Math.floor(count / 60)).padStart(2, "0")}:${String(
        parseInt(count % 60)
      ).padStart(2, "0")}`;
    },
    async pinCodeComplete() {
      if (this.pin === this.getPinCode.pin) {
        this.$store.dispatch("settings/setLockState", false);
        this.$store.commit("settings/resetFailedTimer");
        const { AppState } = await storage.getValue("AppState");
        storage.saveValue({
          AppState: { ...AppState, lastOpened: Date.now() },
        });
        this.$router.push("/home");
      } else {
        this.pincodeError = true;
        this.pin = "";
        if (this.attempts === 1) {
          this.startCountDown();
        }
        this.$store.commit(
          "settings/setAttempts",
          Math.max(this.attempts - 1, 0)
        );
        setTimeout(() => {
          this.pincodeError = false;
        }, 800);
      }
    },
  },
};
</script>

<style>
.lock-page {
  width: 370px;
  height: 600px;
  padding: 1rem;
  text-align: center;
  position: relative;
}
.lock-logo {
  width: 200px;
  height: 200px;
}
.title {
  margin-top: 10px;
  margin-bottom: 40px;
}
.brand-name {
  font-size: 25px;
  color: black;
}
.lastopen-time-caption {
  font-size: 12px;
  margin-top: 5px;
  color: #555;
}
.lastopen-fromnow-caption {
  font-size: 14px;
  margin-top: 10px;
  color: black;
}
.version-info {
  margin-top: 5px;
  font-size: 16px;
  color: grey;
}

#bubbles {
  position: absolute;
  width: 2vmin;
  height: 2vmin;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(12vmin, -8vmin);
  box-shadow: -2vmin -1.25vmin 0 -0.5vmin rgba(255, 255, 255, 0.3),
    -0.75vmin -2.75vmin 0 -0.25vmin rgba(255, 255, 255, 0.5);
  animation: swim 20s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

#shark {
  width: 30vmin;
  height: 10vmin;
  position: absolute;
  transform: translate(-50%, -50%);
  animation: swim 10s, bounce 2s infinite;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

#shark div {
  position: absolute;
  box-sizing: border-box;
}

.shark-body {
  left: 0vmin;
  width: 30vmin;
  height: 20vmin;
  background: red;
  border-radius: 50%;
  transform: translate(0, -50%);
  clip-path: polygon(0% 50%, 100% 50%, 100% 90%, 70% 70%, 90% 100%, 0% 100%);
  background: #aaa;
}

.shark-eye {
  width: 1.5vmin;
  height: 1.5vmin;
  border-radius: 50%;
  background: white;
  box-shadow: inset -0.2vmin -0.45vmin 0 0.6vmin;
  top: 1.5vmin;
  right: 4vmin;
}

.aleta,
.tail,
.fin {
  width: 10vmin;
  height: 8vmin;
  box-shadow: 4vmin -0.5vmin #aaa;
  border-radius: 50%;
  top: -1vmin;
  transform: translate(-130%, -3vmin) rotate(10deg);
}

.aleta {
  box-shadow: 5vmin 0vmin #999;
  top: 5vmin;
  left: 3vmin;
  transform: none;
  clip-path: polygon(0% 50%, 200% 40%, 200% 100%, 0% 100%);
}

.fin {
  box-shadow: 5vmin 0vmin #aaa;
  left: 15vmin;
}

.gill {
  width: 6vmin;
  height: 9vmin;
  border-radius: 100%;
  box-shadow: -2vmin 0 0 -1.7vmin rgba(0, 0, 0, 0.25);
  left: 18.5vmin;
}

.gill-2 {
  transform: translate(-1vmin, 0) scale(0.9);
}

.gill-3 {
  transform: translate(-2vmin, 0) scale(0.8);
}

@keyframes swim {
  0% {
    margin-left: -50%;
  }
  70% {
    margin-left: 100%;
  }
  100% {
    margin-left: 110%;
  }
}

@keyframes bounce {
  0%,
  50%,
  100% {
    -moz-transform: translateY(0);
    -ms-transform: translateY(0);
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
  25% {
    -moz-transform: translateY(-5px);
    -ms-transform: translateY(-5px);
    -webkit-transform: translateY(-5px);
    transform: translateY(-5px);
  }
  75% {
    -moz-transform: translateY(-3px);
    -ms-transform: translateY(-3px);
    -webkit-transform: translateY(-3px);
    transform: translateY(-3px);
  }
}
</style>
