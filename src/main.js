// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import "babel-polyfill"
import Vue from 'vue'
import App from './App'
import router from './router'
import VueVideoPlayer from 'vue-video-player'
// import 'video.js/dist/lang/zh-CN'
// import videojs from 'video.js/dist/video.js'
import 'video.js/dist/video-js.css'
import 'vue-video-player/src/custom-theme.css'
import 'videojs-flash'
import 'videojs-contrib-hls/dist/videojs-contrib-hls'
// import 'videojs-contrib-hls.js/src/videojs.hlsjs'
import "./assets/main.css"
import axios from "axios"
Vue.prototype.$axios = axios;
// import pkg from '../package.json'
import 'element-ui/lib/theme-chalk/index.css';
import ElementUI from 'element-ui';
Vue.use(ElementUI,{size: 'small', zIndex: 3000});
// window.videojs=videojs
Vue.config.productionTip = false
Vue.use(VueVideoPlayer)
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {
    App
  }
})

Vue.filter("timeFromat", function (date) {
  var now = new Date((date || '').replace(/-/g, "/"));
  var hh = now.getHours(); //时
  var mm = now.getMinutes(); //分
  var HHMM = ""
  if (hh < 10) HHMM += "0";
  HHMM += hh + ":";
  if (mm < 10) HHMM += "0";
  HHMM += mm;
  return HHMM;

})

// console.log(`${pkg.name} v${pkg.version} is running`)
