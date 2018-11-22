<template>
 <div class="app">
    <div class="left">
      <div class="live_title">
        <span>直播列表</span>
        <span>比赛直播中<span class="yellow"> {{totalliving}} </span>场</span>
      </div>
      <div class="list_body innerbox">
        <div v-for='item in data ' :key='item.title'>
          <div class="live_name" @click="flodList(item)">
            <div class="fl">{{item.title}}</div>
            <div class="fr"> <span class="orange">{{item.list.length||0}}</span><span class="mlr">场赛事</span>
              <img v-if="!item.isFlod" src="../../static/images/icon_down@2x.png" class="arrow" alt="">
              <img v-else src="../../static/images/icon_up@2x.png" class="arrow" alt="">
            </div>
          </div>

          <div v-if="item.isFlod" v-for="live in item.list" :key="live.secId" 
          class="live_item_info " @click="playVideo(live)">
            <div class="status">
              <div class="live_time clearfix">
                <span class='fl'>{{live.exTime}} {{live.startTime|timeFromat}} - {{live.endTime|timeFromat}}</span>
                <span v-if="live.isliving" class="livingState fr red">正在直播</span>
                <span v-else class="livingState fr green">即将直播</span>
              </div>
              <div class="leagueMatch">
                {{live.leagueMatch}}&nbsp;&nbsp;&nbsp;&nbsp;
                {{live.homeTeam}} vs {{live.visitingTeam}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="right" >
    
      <video-player v-if="videosrc" class="vjs-custom-skin mp4 " width='640px' height='480px' ref="videoPlayer"   :options="playerOptions"
       @ready="onPlayerReadied" 
       @timeupdate="onTimeupdate">
    当前浏览器版本太低，不支持播放此类视频
      </video-player>
      <img v-if="!videosrc&&!flashNoSuport" :src="logoimg"  alt="" style="width:100%;height:100%;boder-radius:5px;" >
      <embed v-if="flashNoSuport" src="./static/media/video-js.swf" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer"
      type="application/x-shockwave-flash" 
      width="100%" height="100%" style="postion:absolute">
    </div>
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
    </div> -->
    <!-- <Switcher></Switcher> -->
  </div>
  
   
</template>

<script>
import Switcher from "@/components/Switcher";
import { md5 } from "@/../static/lib/md5.js";
import { os, Base64 } from "@/../static/lib/utils.js";

const isProduction = process.env.NODE_ENV === "production";

export default {
  name: "live",
  components: {
    Switcher
  },
  data() {
    return {
      flashNoSuport: false,
      logoimg: isProduction
        ? "/docs/static/images/default.png"
        : "/static/images/default.png",
      videosrc: "",
      data: [],
      flvPlayer: null,
      initialized: false,
      currentTech: "",
      streams: {
        rtmp: "",
        hls: ""
      },
      playerOptions: {
        overNative: true,
        autoplay: false,
        controls: true,
        techOrder: ["flash", "html5"],
        sourceOrder: true,
        flash: {
          hls: { withCredentials: false },
          swf: isProduction
            ? "/docs/static/media/video-js.swf"
            : "/static/media/video-js.swf"
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
        poster: isProduction
          ? "/docs/static/images/default.png"
          : "/static/images/default.png"
        // controlBar: {
        //   timeDivider: false, // 时间分割线
        //   durationDisplay: false, // 总时间
        //   progressControl: true, // 进度条
        //   customControlSpacer: true, // 未知
        //   fullscreenToggle: true // 全屏
        // }
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
      this.getList();
      this.checkFlash();
    } else {
      this.$router.push("/mLive");
    }
  },

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
        console.log("flash ok");
        this.flashNoSuport = false;
      } else {
        console.log("flash error");
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
      console.log("currentTime", e.cache_.currentTime);
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

    getList() {
      this.loading = true;
      this.$axios
        .get("/wewin-rest/auth", {
          params: { userName: "admin", password: "admin" }
        })
        .then(res => {
          var salt = res.data.randomKey;
          var bs64 = new Base64();
          var json = JSON.stringify({ sportsType: -1, startTime: "" });
          var encode = bs64.encode(json);
          var md5Srt = md5(encode + salt);
          var Authorization = "Bearer " + res.data.token;
          this.$axios({
            method: "post",
            url: "/wewin-rest/football/list",
            data: JSON.stringify({ object: encode, sign: md5Srt }),
            headers: {
              Authorization: Authorization,
              "Content-Type": "application/json"
            }
          }).then(res => {
            this.loading = false;
            this.data = this.dealData(res.data);
          });
        })
        .catch(err => {
          this.loading = false;
          console.log(err);
          // alert(err.message);
        });
    },

    // 序列化列表
    dealData(data) {
      var list = [];
      // 类型(0 足球,1,篮球,2,网球,3 电竞,4 羽毛球,5 乒乓球,6 排球)
      var typeMap = [
        "足球",
        "篮球",
        "网球",
        "电竞",
        "羽毛球",
        "乒乓球",
        "排球"
      ];
      typeMap.map((v, i) => {
        list.push({
          title: v + "赛事",
          count: 0,
          liveType: i,
          list: [],
          isFlod: true
        });
      });
      // console.log(list)
      data.map((v, i) => {
        this.isliving(v);
        list.map((vl, il) => {
          if (v.liveType == vl.liveType) {
            vl.count++;
            vl.list.push(v);
          }
        });
      });
      // console.log(list);
      return list;
    },

    //判断是否是正在直播
    isliving(item) {
      var now = new Date();
      var begin = new Date((item.startTime || "").replace(/-/g, "/"));
      var end = new Date((item.endTime || "").replace(/-/g, "/"));
      if ((begin <= now) & (now <= end)) {
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
          console.log(
            this.moment(begin),
            this.moment(tomorrow),
            this.moment(afterTomorrow)
          );
          item.exTime = "明日";
        } else if (begin > afterTomorrow) {
          var month = begin.getMonth() + 1; //月
          var day = begin.getDate();
          item.exTime = month + "月" + day + "日";
        }
      }
    },

    //自己封装的moment
    moment(date) {
      var now = new Date(date.replace(/-/g, "/"));
      var year = now.getFullYear(); //年
      var month = now.getMonth() + 1; //月
      var day = now.getDate(); //日

      var hh = now.getHours(); //时
      var mm = now.getMinutes(); //分
      var ss = now.getSeconds(); //秒
      var clock = year + "-";
      if (month < 10) clock += "0";
      clock += month + "-";
      if (day < 10) clock += "0";
      clock += day + " ";
      if (hh < 10) clock += "0";
      clock += hh + ":";
      if (mm < 10) clock += "0";
      clock += mm + ":";
      if (ss < 10) clock += "0";
      clock += ss;
      return clock;
    },

    // 折叠list
    flodList(item) {
      console.log(item.isFlod);
      if (item.list.length == 0) return;
      item.isFlod = !item.isFlod;
      this.$forceUpdate();
    },

    // 点击播放直播
    playVideo(item) {
      if (!item.isliving) return alert("尚未开播");
      this.destoryVideo();
      this.videosrc = item.rtmpUrl;
      this.playerOptions.sources[1].src = item.m3u8Url;
      this.playerOptions.sources[0].src = item.rtmpUrl;
      this.playerOptions.autoplay = true;
    },

    // 销毁电影
    destoryVideo(cb) {
      if (!this.flvPlayer) return;
      this.flvPlayer.pause();
      this.flvPlayer.unload();
      this.flvPlayer.detachMediaElement();
      this.flvPlayer.destroy();
      this.flvPlayer = null;
      // cb && cb();
    }
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
  padding: 4px 0;
  margin: 0 23px;
  border-bottom: 1px solid rgba(242, 248, 255, 0.05);
  cursor: pointer;
  box-sizing: border-box;
  transform: 0.5 easy-in-out;
  overflow: hidden;
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
}

.mp4 {
  height: 100%;
  width: 100%;
  background-color: #fff;
  border-radius: 5px;
  background: black;
  overflow: hidden;
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
