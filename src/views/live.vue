<template>
  <div class="app">
    <div class="left" v-loading="loading">
      <div class="live_title" >
        <span>直播列表</span>
        <span>
          比赛直播中
          <span class="yellow">{{totalliving}}</span> 场
        </span>
      </div>
      <div class="list_body innerbox" >
        <div v-for="item in data " :key="item.title">
          <div class="live_name" @click="flodList(item)">
            <div class="fl">{{item.title}}</div>
            <div class="fr">
              <span class="orange">{{item.list.length||0}}</span>
              <span class="mlr">场</span>
              <img v-if="!item.isFlod" src="../../static/images/icon_down@2x.png" class="arrow" alt>
              <img v-else src="../../static/images/icon_up@2x.png" class="arrow" alt>
            </div>
          </div>

          <div
            v-if="item.isFlod"
            v-for="live in item.list"
            :key="live.secId"
            class="live_item_info"
            @click="playVideo(live)"
            :class="{active:currentVideo.secId==live.secId}"
            :title="live.leagueMatch+' -- '+
                live.homeTeam+ ' vs ' +live.visitingTeam"
          >
            <div class="status" >
              <div class="live_time clearfix" :class="{red:currentVideo.secId==live.secId}">
                <span
                  class="fl"
                >{{live.exTime}} {{live.startTime|timeFromat}} - {{live.endTime|timeFromat}}</span>
                <span v-if="live.isliving" class="livingState fr red">正在直播</span>
                <span v-else class="livingState fr green">即将直播</span>
              </div>
              <div class="leagueMatch" :class="{red:currentVideo.secId==live.secId}">
                {{live.leagueMatch}}&nbsp;&nbsp;&nbsp;&nbsp;
                {{live.homeTeam}} vs {{live.visitingTeam}}
              </div>
            </div>

            <div class="live_item_info_playing"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="right" v-loading="loading_right">
      <video-player
        v-show="videosrc"
        class="vjs-custom-skin mp4"
        width="640px"
        height="480px"
        ref="videoPlayer"
        :options="playerOptions"
        @ready="onPlayerReadied"
        @timeupdate="onTimeupdate"
      >当前浏览器版本太低，不支持播放此类视频</video-player>
      <img
        v-if="!videosrc||loading_right"
        :src="logoimg"
        alt
        style="width:100%;height:100%;boder-radius:5px; position:absolute;left: 0;top: 0;"
      >
      <embed
        v-show="flashNoSuport"
        src="./static/media/video-js.swf"
        quality="high"
        pluginspage="http://www.macromedia.com/go/getflashplayer"
        type="application/x-shockwave-flash"
        width="100%"
        height="100%"
        style="width:100%;height:100%;boder-radius:5px; position:absolute;left: 0;top: 0;"
      >
     <div v-show="flashNoSuport" class="flash-version-tips"><div class="flash-tips-cover"></div><div class="flash-tips-close">×</div><p class="flash-tips-text">您尚未安装 / 启用flash，无法正常播放，请查看<a href="http://www.adobe.com/go/getflashplayer" target="_blank" class="flash-get-link">安装教程</a>/<a href="https://www.douyu.com/cms/gong/201712/19/6921.shtml" target="_blank" class="flash-get-link">启用教程</a></p><p class="flash-tips-text">（安装 / 设置完成后，请重启浏览器）</p></div>
    </div>

    <!-- 注单链接 -->
    <!-- <div class="betPageLink">
      <a href="#">
        <img src="/static/images/bet.png" alt>
      </a>
    </div> -->
    <!-- <div class="selectWrapper">

      Switch Tech：
      <div class="form-check">
        <input class="form-check-input" type="radio" name="tech" id="html5" value="Html5" v-model="currentTech" @change="changeTech">
        <label class="form-check-label" for="html5">
          Html5
        </label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="tech" id="flash" value="Flash" v-model="currentTech" @change="changeTech">
        <label class="form-check-label" for="flash">
          Flash
        </label>
      </div>
    </div>-->
    <!-- <Switcher></Switcher> -->
  </div>
</template>

<script>
import Switcher from "@/components/Switcher";
import { md5 } from "@/../static/lib/md5.js";
import { os, Base64 } from "@/../static/lib/utils.js";
import VueVideoPlayer from "vue-video-player";
import ZN from "@/../static/lib/videojs.zh-CN.json";
import * as videojs from "video.js/dist/video.js";
const isProduction = process.env.NODE_ENV === "production";
import { typeMap } from "@/assets/js/typeMap";
export default {
  name: "live",
  components: {
    Switcher
  },
  data() {
    return {
      loading_right: false,
      loading:true,
      flashNoSuport: false,
      listRequestCount:0,
      logoimg: "/static/images/default.png",
      videosrc: "",
      bs64: new Base64(),
      data: [],
      flvPlayer: null,
      initialized: false,
      currentVideo: {},
      currentTech: "",
      streams: {
        rtmp: "",
        hls: ""
      },
      playerOptions: {
        language: "zh-CN",
        languages: {
          "zh-CN": ZN
        },
        overNative: true,
        autoplay: false,
        controls: true,
        techOrder: ["flash"],
        sourceOrder: true,
        flash: {
          hls: { withCredentials: false },
          swf: "/static/media/video-js.swf"
        },
        html5: { hls: { withCredentials: false } },
        sources: [
          {
            type: "rtmp/mp4",
            src:
              "rtmp://qqjs.flylemon.cn/football/live_9vjsl0f8?auth_key=1542650400-0-0-9557f19bfebae0d204465d9d28f6e395"
          },
          {
            withCredentials: false,
            type: "application/x-mpegURL",
            src:
              "http://qqjs.flylemon.cn/football/live_9vjsl0f8.m3u8?auth_key=1542650400-0-0-c627ef6c2da7277ad814af283651182e"
          }
        ],
        poster:"/static/images/default.png",
        controlBar: {
          timeDivider: false, // 时间分割线
          durationDisplay: false, // 总时间
          progressControl: false, // 进度条
          customControlSpacer: false, // 未知
          currentTimeDisplay: false, //当前时间
          remainingTimeDisplay: false, //总时间
          fullscreenToggle: true, // 全屏
          volumePanel: {
            inline: false
          }
        }
      }
    };
  },
  computed: {
    player() {
      return this.$refs.videoPlayer.player;
    },
    currentStream() {
      return this.currentTech === "Flash" ? "RTMP" : "HLS";
    },
    totalliving() {
      var total = 0;
      this.data.map(v => {
        v.list.map(vl => {
          if (vl.isliving) {
            total++;
          }
        });
      });
      return total;
    }
  },

  created() {
    if (os.isPc) {
      this.getToken().then(() => {
        this.getList();
      });
      this.checkFlash();
    } else {
      this.$router.push("/mLive");
    }
  },
  mounted() {},

  methods: {
    // 检测浏览器是否启用flash
    checkFlash() {
      var flag = false;
      if (window.ActiveXObject) {
        try {
          var swf = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
          if (swf) {
            flag = true;
          }
        } catch (e) {}
      } else {
        try {
          var swf = navigator.plugins["Shockwave Flash"];
          if (swf) {
            flag = true;
          }
        } catch (e) {}
      }
      if (flag) {
        // console.log("flash ok");
        this.flashNoSuport = false;
      } else {
        // console.log("flash error");
        this.flashNoSuport = true;
      }
    },
    onPlayerReadied() {
      if (!this.initialized) {
        this.initialized = true;
        this.currentTech = this.player.techName_;
        console.log(this.currentTech);
      }
    },
    // record current time
    onTimeupdate(e) {
      this.loading_right = false;
      // console.log("currentTime", e.cache_.currentTime);
    },

    enterStream() {
      this.playerOptions.sources[1].src = this.streams.hls;
      this.playerOptions.sources[0].src = this.streams.rtmp;
      this.playerOptions.autoplay = true;
    },
    changeTech() {
      if (this.currentTech === "Html5") {
        this.playerOptions.techOrder = ["html5"];
      } else if (this.currentTech === "Flash") {
        this.playerOptions.techOrder = ["flash"];
      }
      this.playerOptions.autoplay = true;
    },

    getToken() {
      return new Promise((resolve, reject) => {
        this.loading = true;
        this.$axios
          .get("/wewin-rest/auth", {
            params: { userName: "admin", password: "admin", _t: new Date() * 1 }
          })
          .then(res => {
            this.loading = false;
            // console.log(res.data); //
            this.salt = res.data.randomKey;
            this.token = res.data.token;
            resolve();
          })
          .catch(err => {
            reject(err);
          });
      });
    },
    getList() {
      if(this.listRequestCount<=0){
        this.loading = true;
      }else{
        this.listRequestCount++;
      }

      var json = JSON.stringify({ sportsType: -1, startTime: "" });
      var encode = this.bs64.encode(json);
      var md5Srt = md5(encode + this.salt);
      this.Authorization = "Bearer " + this.token;
      this.$axios({
        method: "post",
        url: "/wewin-rest/football/list?_t=" + new Date() * 1,
        data: JSON.stringify({ object: encode, sign: md5Srt }),
        headers: {
          Authorization: this.Authorization,
          "Content-Type": "application/json"
        }
      })
        .then(res => {
          this.loading = false;
          this.data = this.dealData(res.data);
          var timer = setTimeout(() => {
            this.getList();
            clearTimeout(timer);
          }, 30000);
        })
        .catch(err => {
          this.loading = false;
          console.log(err);
          // alert(err.message);
        });
    },

    // 获取对应清晰度的资源URL
    getDfUrl(type, cb) {
      var item = this.currentVideo;
      // console.log(type, item.secId, this.salt, this.token);
      this.loading_right = true;
      var json = JSON.stringify({
        secId: item.secId,
        playType: 0,
        tranScoding: type * 1
      });
      var encode = this.bs64.encode(json);
      var md5Srt = md5(encode + this.salt);

      this.$axios({
        method: "post",
        url: "/wewin-rest/football/transcoding",
        data: JSON.stringify({ object: encode, sign: md5Srt }),
        headers: {
          Authorization: this.Authorization,
          "Content-Type": "application/json"
        }
      })
        .then(res => {
          this.loading_right = false;
          // console.log(res.data.rtmpUrl);
          if (res.data.code == 200) {
            this.playerOptions.sources[0].src = res.data.rtmpUrl;
            cb && cb();
          } else {
            // console.log(res)
          }
        })
        .catch(err => {
          console.log(err.message);
          this.loading_right = false;
          this.$message("当前资源失效,请尝试其他资源");
        });
    },

    // 序列化列表
    dealData(data) {
      var list = [];
      typeMap.map((v, i) => {
        list.push({
          title: v.title,
          count: 0,
          liveType: i,
          list: [],
          isFlod: true,
          icon: v.icon
        });
      });
      // 第二次刷新进入，如果正在播放的资源不在播放列表中，则准备更换资源
      // if (this.videosrc) {
      //   var flag = false;
      //   data.map((v, i) => {
      //     if (v.secId == this.currentVideo.secId) {
      //       flag = true;
      //       //  防止标清的时候资源有变
      //       if (
      //         this.currentVideo.m3u8Url != v.m3u8Url &&
      //         this.currentVideo.rate == "标清"
      //       ) {
      //         this.currentVideo.m3u8Url = v.m3u8Url;
      //       }
      //     }
      //   });

      //   if (flag == false) {
      //     this.videosrc = "";
      //   }
      // }

      data.map((v, i) => {
        this.isliving(v);
        // 自动播放第一个
        // if (!this.videosrc && v.isliving) {
        //   this.playVideo(v);
        // }
        list.map((vl, il) => {
          if (v.liveType == vl.liveType) {
            vl.count++;
            vl.list.push(v);
          }
        });
      });
      // 列表排序
      list.sort((a, b) => {
        return b.count - a.count;
      });
      //  list[0].list.length > 0&&this.playVideo(list[0].list[0]);
      return list;
    },

    //判断是否是正在直播
    isliving(item) {
      var now = new Date();
      // var now = new Date("2018/12/04 21:00:00");
      var begin = new Date((item.startTime || "").replace(/-/g, "/"));
      var end = new Date((item.endTime || "").replace(/-/g, "/"));
      // console.log(item.startTime,item.endTime)
      // console.log(begin <= now,now <= end)
      if ((begin <= now) && (now <= end)) {
        item.isliving = true;
      } else {
        item.isliving = false;
        var tomorrow = new Date(
          new Date(new Date().toLocaleDateString()).getTime() +
            24 * 60 * 60 * 1000 -
            1
        );
        var afterTomorrow = new Date(
          new Date(new Date().toLocaleDateString()).getTime() +
            48 * 60 * 60 * 1000 -
            1
        );
        if (begin > tomorrow && begin < afterTomorrow) {
          item.exTime = "明日";
        } else if (begin > afterTomorrow) {
          var month = begin.getMonth() + 1; //月
          var day = begin.getDate();
          item.exTime = month + "月" + day + "日";
        }
      }
    },

    // 折叠list
    flodList(item) {
      // console.log(item.isFlod);
      if (item.list.length == 0) return;
      item.isFlod = !item.isFlod;
      this.$forceUpdate();
    },

    // 点击播放直播
    playVideo(item) {
      if (!item.isliving) return this.$alert("还没有开播哦,敬请期待...");
      this.currentVideo = item;
      this.currentVideo.rate = "流畅";
      this.loading_right = true;
      this.settingCtrl();
      this.videosrc = item.rtmpUrl;
      this.playerOptions.sources[1].src = item.m3u8Url;
      this.playerOptions.sources[0].src = item.rtmpUrl;
      this.playerOptions.autoplay = true;
      // this.$nextTick(() => {
        // this.$refs.videoPlayer.player.play();
      // });
    },

    //设置控制器按钮部分
    settingCtrl() {
      var _this = this;
      setTimeout(() => {
        if ($(".vjs-rate-control").length > 0) {
          return;
        }
        $(".vjs-control-bar")
          .append(`<div class="vjs-rate-control vjs-menu-button
           vjs-menu-button-popup vjs-control vjs-button vjs-hiddenvjs-control vjs-button"
            type="button" aria-live="polite"
              aria-disabled="false" > <p>标清</p>
              <span aria-hidden="true"
              class="vjs-icon-placeholder">
            </span>
            <ul class="rate_select">
            <li class="rate_select_item" type="3">超清</li>
            <li class="rate_select_item" type="2">高清</li>
            <li class="rate_select_item" type="1">标清</li>
            <li class="rate_select_item active" type="0">流畅</li>
            </ul>
            <span class="vjs-control-text">清晰度</span></div>`);
        $(".rate_select_item").map((i, v) => {
          if ($(v).html() == _this.currentVideo.rate) {
            $(v).addClass("active");
          } else {
            $(v).removeClass("active");
          }
        });
$(".vjs-control-bar").on("click", ".vjs-rate-control",function(){
  console.log(11)
  $(".rate_select").show();

});
        $(".vjs-rate-control p").html(_this.currentVideo.rate);
        var isFullscreen = this.player.isFullscreen();
        $(".vjs-control-bar").on("click", ".rate_select_item", function() {
          if ($(this).hasClass("active")) return;
          var ele = this;
          _this.getDfUrl($(this).attr("type"), () => {
            _this.currentVideo.rate = $(ele).html();
            // console.log(this.player.isFullscreen)
            _this.loading_right = true;
            // isFullscreen && this.player.enterFullWindow();
            // console.log("毁掉",$(ele).html())
            _this.settingCtrl();
          });
        });
      }, 1000);
    },


  }
};
</script>

<style scoped>
.liveView {
  position: relative;
}

.selectWrapper {
  /* display: flex; */
  /* justify-content: center; */
  /* align-items: center; */
  font-size: 20px;
  line-height: 30px;
  margin: 20px;
  /* vertical-align: baseline; */
}

.inputWrapper {
  width: 500px;
  margin: 0 auto;
}

.buttonWrapper {
  text-align: center;
}
html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: relative;
}

.app {
  /* margin: 0 auto; */
  vertical-align: center;
  height: 480px;
  width: 964px;
  background-color: white;
  border-radius: 5px;
  position: absolute;
  left: 50%;
  top: 50%;
  margin: -268px -482px;
}

.left {
  float: left;
  width: 304px;
  height: 100%;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #242526;
  font-size: 14px;
}

.live_title {
  text-align: left;
  border-radius: 5px;
  height: 55px;
  padding: 0 24px;
  line-height: 55px;
  background-color: #0c0c0d;
  font-family: PingFangSC-Light;
  font-weight: 300;
  color: rgba(255, 255, 255, 1);
  font-size: 16px;
}

.live_title span:nth-child(2) {
  float: right;
  font-size: 14px;
}

.list_body {
  background-color: #242526;
  height: 414px;
  overflow-y: auto;
}

/* 类别名称 */
.live_name {
  height: 38px;
  margin: 7px 12px;
  background: rgba(247, 251, 255, 1);
  box-shadow: 0px -3px 5px 0px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  color: #242526;
  font-size: 14px;
  line-height: 38px;
  padding: 0 11px;
  cursor: pointer;
}

.live_name .arrow {
  width: 11px;
  height: 11px;
}

/* 子项详情 */
.live_item_info {
  line-height: 24px;
  padding: 4px 10px;
  margin: 0 12px;
  border-bottom: 1px solid rgba(244, 245, 247, 0.192);
  cursor: pointer;
  box-sizing: border-box;
  transform: 0.5 easy-in-out;
  overflow: hidden;
  position: relative;
}
.live_item_info:hover,
.live_item_info.active {
  background-color: rgba(255, 255, 255, 0.1);
}
.live_item_info_playing {
  display: none;
}
.live_item_info.active .live_item_info_playing {
  display: block;
  position: absolute;
  line-height: 56px;
  font-size: 16px;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  /* background-color: rgba(255, 255, 255, 0.8); */
}
.live_item_info.show {
  height: 0;
  overflow: hidden;
}

.live_time {
  color: #f2f8ff;
}

.leagueMatch {
  text-align: left;
  color: #808080;
  /* width: 258px; */
  overflow: hidden;
  /*超出部分隐藏*/
  white-space: nowrap;
  /*不换行*/
  text-overflow: ellipsis;
  /*超出部分文字以...显示*/
}

/* .leagueMatch:hover {height: auto; word-break:break-all; white-space: pre-wrap;  text-decoration: none;} */
/* 右侧播放器 */
.right {
  width: 640px;
  height: 480px;
  border-radius: 4px;
  /* background-color: #000; */
  float: right;
  border-radius: 5px;
  position: relative;
  background-color: rgba(182, 182, 182, 0.356);
  /* background: url('/static/images/default.png'); */
}

.mp4 {
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 5px;
  background: black;
  overflow: hidden;
}
.betPageLink {
  position: absolute;
  width: 183px;
  height: 48px;
  right: 20px;
  top: 12px;
}
.betPageLink a {
  display: block;
  width: 100%;
  height: 100%;
}
.betPageLink img {
  width: 100%;
  height: 100%;
}
/* .video-js .vjs-big-play-button   { 
  top: 50%;
  left: 50%;
  margin-left: -1.5rem;
  margin-top: -.75rem;
} */

/* video::-webkit-media-controls-fullscreen-button {
  display: none;
} */

/* video::-webkit-media-controls-{
  display:none;
} */
/* video::-webkit-media-controls-enclosure{
  display:none !important;
} */

/*滚动条样式*/
.innerbox::-webkit-scrollbar {
  /*滚动条整体样式*/
  width: 6px;
  /*高宽分别对应横竖滚动条的尺寸*/
  height: 4px;
}

.innerbox::-webkit-scrollbar-thumb {
  /*滚动条里面小方块*/
  border-radius: 5px;
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  background: rgba(245, 245, 245, 0.466);
}

.innerbox::-webkit-scrollbar-track {
  /*滚动条里面轨道*/
  -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
  border-radius: 0;
  background: rgba(0, 0, 0, 0.1);
}

.yellow {
  color: #ffdd33;
}

.orange {
  color: #ff3333;
}

.red {
  color: #ff3333;
}

.green {
  color: #00cc29;
}
</style>
