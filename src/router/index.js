import Vue from 'vue'
import Router from 'vue-router'
// import live from '@/views/live'
// import playback from '@/views/playback'
const live = () => import('@/views/live')
const mLive = () => import('@/views/mLive')

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'live',
      component: live
    }, {
      path: '/mLive',
      name: 'mLive',
      component: mLive
    }
  ]
})
