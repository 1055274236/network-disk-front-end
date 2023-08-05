<script lang="ts" setup>
import { reactive, onMounted, watch } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import LoginApi from '@renderer/api/modules/login'
import { Check, Close } from '@element-plus/icons-vue'

const data = reactive({
  isLock: true,

  account: '',
  password: '',
  repPassword: '',
  name: '',
  isLoding: false,
  disabled: false,
  showLogin: true,
  isShake: false,

  isAutoLogin: false,
  isRemAccount: false
})

onMounted(async () => {
  data.isAutoLogin = await window.electron.ipcRenderer.invoke('store:get', 'isAutoLogin')
  data.isRemAccount = await window.electron.ipcRenderer.invoke('store:get', 'isRemAccount')
  if (data.isRemAccount === true) {
    data.account = await window.electron.ipcRenderer.invoke('store:get', 'account')
    data.password = await window.electron.ipcRenderer.invoke('store:get', 'password')
    if (data.isAutoLogin === true) {
      loginClick()
    }
  }
})

const loginClick = async (): Promise<void> => {
  data.isLoding = true
  data.disabled = true
  const result = await LoginApi.login(data.account, data.password).finally(() => {
    data.disabled = false
    data.isLoding = false
  })
  if (result.code === 200) {
    loginSuccess()
  } else {
    lockShake()
  }
}

const signClick = async (): Promise<void> => {
  data.isLoding = true
  data.disabled = true
  const result = await LoginApi.signIn(data.account, data.password, data.name).finally(() => {
    data.disabled = false
    data.isLoding = false
  })
  if (result.code === 200) {
    loginSuccess()
  } else {
    window.electron.ipcRenderer.send('store:set', 'isAutoLogin', false)
    lockShake()
  }
}

const loginSuccess = (): void => {
  data.isLock = false
  if (data.isRemAccount) {
    window.electron.ipcRenderer.send('store:set', 'account', data.account)
    window.electron.ipcRenderer.send('store:set', 'password', data.password)
    window.electron.ipcRenderer.send('store:set', 'isRemAccount', data.isRemAccount)
    if (data.isAutoLogin) {
      window.electron.ipcRenderer.send('store:set', 'isAutoLogin', true)
    }
  }
  setTimeout(() => {
    window.electron.ipcRenderer.send('window:logged')
  }, 500)
}

const disabledButton = (): void => {
  data.disabled = true
  data.showLogin = !data.showLogin
  setTimeout(() => {
    data.disabled = false
  }, 500)
}

const lockShake = useThrottleFn(() => {
  lockShakeFn()
}, 800)
const lockShakeFn = (): void => {
  data.isShake = true
  setTimeout(() => {
    data.isShake = false
  }, 800)
}
watch(
  () => data.isRemAccount,
  (newValue) => {
    if (newValue === false) data.isAutoLogin = newValue
  }
)
</script>

<template>
  <div id="login">
    <!-- left -->
    <div class="left-block show-block">
      <div :class="['hide-block', { show: data.showLogin }]">
        <div :class="['lock', { shake: data.isShake }, { unlock: !data.isLock }]">
          <div class="lock-head"></div>
          <div class="lock-body"></div>
        </div>
      </div>
      <div :class="['hide-block', { show: !data.showLogin }]">
        <div class="sign-content form-content">
          <div class="title">注册</div>
          <el-form>
            <el-form-item label="账号">
              <el-input v-model="data.account"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="data.password" type="password"></el-input>
            </el-form-item>
            <el-form-item label="名称">
              <el-input v-model="data.name"></el-input>
            </el-form-item>
            <el-form-item class="form-bottom">
              <el-button
                :loading="data.isLoding"
                type="info"
                :disabled="data.disabled"
                @click="disabledButton"
              >
                登录
              </el-button>
              <el-button
                :loading="data.isLoding"
                type="primary"
                :disabled="data.disabled"
                @click="signClick"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- right -->
    <div class="right-block show-block">
      <div :class="['hide-block', { show: !data.showLogin }]">
        <div :class="['lock', { shake: data.isShake }, { unlock: !data.isLock }]">
          <div class="lock-head"></div>
          <div class="lock-body"></div>
        </div>
      </div>
      <div :class="['hide-block', { show: data.showLogin }]">
        <div class="login-content form-content">
          <div class="title">登录</div>
          <el-form>
            <el-form-item label="账号">
              <el-input v-model="data.account" @keyup.enter="loginClick"></el-input>
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="data.password"
                type="password"
                @keyup.enter="loginClick"
              ></el-input>
            </el-form-item>
            记住密码：
            <el-switch
              v-model="data.isRemAccount"
              class="mt-2"
              style="margin-left: 24px"
              inline-prompt
              :active-icon="Check"
              :inactive-icon="Close"
            />
            自动登录：
            <el-switch
              v-model="data.isAutoLogin"
              class="mt-2"
              style="margin-left: 24px"
              inline-prompt
              :disabled="!data.isRemAccount"
              :active-icon="Check"
              :inactive-icon="Close"
            />
            <!-- <el-form-item label="记住账密">
              <el-switch
                v-model="data.isRemAccount"
                class="mt-2"
                style="margin-left: 24px"
                inline-prompt
                :active-icon="Check"
                :inactive-icon="Close"
              />
            </el-form-item>
            <el-form-item label="自动登录">
              <el-switch
                v-model="data.isAutoLogin"
                class="mt-2"
                style="margin-left: 24px"
                inline-prompt
                :disabled="!data.isRemAccount"
                :active-icon="Check"
                :inactive-icon="Close"
              />
            </el-form-item> -->

            <el-form-item class="form-bottom">
              <el-button
                :loading="data.isLoding"
                type="info"
                :disabled="data.disabled"
                @click="disabledButton"
              >
                注册
              </el-button>
              <el-button
                :loading="data.isLoding"
                type="primary"
                :disabled="data.disabled"
                @click="loginClick"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#login {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;

  .show-block {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;

    .hide-block {
      position: absolute;
      width: 100%;
      transition: all 0.5s ease;
    }
    .show {
      left: 0 !important;
    }
  }

  .title {
    font-weight: 600;
    font-size: 1.6rem;
    text-align: center;
    line-height: 5rem;
  }

  & > * {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .form-content {
    width: 80%;
    margin: 0 auto;
  }

  .left-block {
    .hide-block {
      left: 100%;
    }
  }

  .right-block {
    .hide-block {
      left: -100%;
    }
  }
}
</style>

<style>
.form-bottom {
  .el-form-item__content {
    display: flex;
    justify-content: center;
  }
}
</style>
<style lang="scss" scoped>
.lock {
  width: 120px;
  height: 200px;
  position: relative;
  --lock-color: red;
  margin: 0 auto;
  * {
    transition: all 0.5s ease;
  }

  &.shake {
    animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
  }

  .lock-head {
    height: calc(50% - 10px);
    width: calc(90% - 20px);
    border: solid 10px;
    border-color: var(--lock-color);
    border-top-left-radius: 300px;
    border-top-right-radius: 300px;
    border-bottom: none;
    text-align: center;
    margin: 0 auto;
    position: relative;
    top: 20px;
  }

  .lock-body {
    background-color: var(--lock-color);
    height: 50%;
    width: 100%;
    border-radius: 5px;
  }
}
.unlock {
  --lock-color: #228b22;

  .lock-head {
    top: 0;
  }
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
