import { defineStore } from 'pinia'

export default defineStore('router', {
  state: () => ({
    routerArr: [],
    routerIndex: 0
  }),

  actions: {
    addRouter() {
      this.routerArr.push()
      this.routerIndex++
    }
  }
})
