<template>
 <div class="app">
   <video-player class="vjs-custom-skin mp4 " v-if="videosrc" width='640px' height='480px' ref="videoPlayer"   :options="playerOptions"
     @ready="onPlayerReadied" 
     @timeupdate="onTimeupdate">
    </video-player>
    <img class="logo" v-else :src="logoimg" alt="">
    
    <swiper :options="swiperOption" class="list_box">
        <swiper-slide  :key="1" >
          <div class="list_body innerbox">
            <div v-for='item in data ' :key='item.title'>
              <div class="live_name" @click="flodList(item)">
                <div class="fl"><i :class="item.icon"></i> {{item.title}} <span class="orange mlr">{{item.list.length||0}}</span>场</div>
                <div class="fr"> <span class="mlr">选择分类</span>
                  <img v-if="!item.isFlod" src="../../static/images/icon_down@2x.png" class="arrow" alt="">
                  <img v-else src="../../static/images/icon_up@2x.png" class="arrow" alt="">
                </div>
              </div>
             
              <div v-if="item.isFlod" v-for="live in item.list" :key="live.secId" 
              class="live_item_info " @click="playVideo(live)">
                <div class="status">
                  <div class="fl">
                    <div class="leagueMatch">
                    {{live.leagueMatch}}&nbsp;&nbsp;&nbsp;&nbsp;
                    {{live.homeTeam}} vs {{live.visitingTeam}}
                  </div>
                  <div class="live_time clearfix">
                    <span class='fl'>{{live.exTime}} {{live.startTime|timeFromat}} - {{live.endTime|timeFromat}}</span>
                    
                  </div>
                  </div>
                </div>
                  <div class="fr livingStateCon">
                    <span v-if="live.isliving" class="livingState  red">正在直播</span>
                    <span v-else class="livingState  green">即将直播</span>
                  </div>
              </div>
            </div>
          </div>

         </swiper-slide>
        </swiper>
    </div>
      

  
   
</template>

<script>
import Switcher from "@/components/Switcher";

const isProduction = process.env.NODE_ENV === "production";
// console.log(process.env.NODE_ENV + "环境");
import "swiper/dist/css/swiper.css";
import { swiper, swiperSlide } from "vue-awesome-swiper";
export default {
  name: "live",
  components: {
    Switcher,
    swiper,
    swiperSlide
  },

  data() {
    return {
      swiperOption: {},
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
        techOrder: ["html5", "flash"],
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
    this.getList();
    document.getElementsByTagName("html")[0].style.fontSize =
      window.innerWidth / 37.5 + "px";
  },

  methods: {
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
        .get("/football/list")
        .then(res => {
          this.loading = false;
          this.data = this.dealData(res.data);
        })
        .catch(err => {
          this.loading = false;
          alert(err.message);
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
      var icon = [
        "icon-swticonzuqiu iconfont",
        "icon-lanqiu iconfont",
        "icon-if_sports_tennis_bal iconfont",
        "icon-youxi iconfont",
        "icon--yumaoqiu iconfont",
        "icon-pingpangkongxin2 iconfont",
        "icon-paiqiu iconfont"
      ];
      typeMap.map((v, i) => {
        list.push({
          title: v+"赛事",
          count: 0,
          liveType: i,
          list: [],
          isFlod: true,
          icon: icon[i]
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
      console.log(item.isFlod);
      if (item.list.length == 0) return;
      item.isFlod = !item.isFlod;
      this.$forceUpdate();
    },

    // 点击播放直播
    playVideo(item) {
      if (!item.isliving) return alert("尚未开播");
      console.log(111111);
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

<style scoped >
.mp4 {
  height: 21.1rem;
  width: 37.5rem;
  width: 100%;
  background-color: #fff;
  /* border-radius: 5px; */
  background: black;
  overflow: hidden;
}
.logo {
  height: 21.1rem;
  width: 37.5rem;
  width: 100%;
  /* width: 37.5rem; */
}

.app {
  vertical-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  background-color: white;
  position: relative;
  /* border-radius: 5px; */
}
.list_box {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 21.1rem;
}

.list_body {
  background-color: white;
  height: 100%;
  overflow-y: auto;
  background: rgba(230, 236, 242, 1);
}
.seleter {
  height: 4.4rem;
  background: rgba(230, 236, 242, 1);
  color: #242526;
  font-size: 1.4rem;
  line-height: 4.4rem;
  padding: 0 2rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(223, 223, 223, 0.514);
}
/* 类别名称 */
.live_name {
  height: 4.4rem;
  background: rgba(230, 236, 242, 1);
  color: #242526;
  font-size: 1.4rem;
  line-height: 4.4rem;
  padding: 0 2rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(223, 223, 223, 0.514);
}
.iconfont {
  font-size: 2rem;
  /* color: #ff3333; */
  display: inline-block;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  vertical-align: -0.5rem;
  fill: currentColor;
  overflow: hidden;
}
.live_name .arrow {
  width: 11px;
  height: 11px;
  vertical-align: 0.05rem;
}

/* 子项详情 */
.live_item_info {
  padding: 0.5rem 2rem;
  /* margin: 0 23px; */
  border-bottom: 1px solid rgba(230, 236, 242, 1);
  box-sizing: border-box;
  width: 100%;
  height: 5.05rem;
  background: rgba(247, 251, 255, 1);
  color: black;
}

.live_item_info.show {
  height: 0;
  overflow: hidden;
}
.live_item_info {
  position: relative;
}

.live_time {
  font-size: 1.2rem;
  font-family: PingFangSC-Light;
  font-weight: 300;
  color: rgba(161, 169, 179, 1);
}

.leagueMatch {
  font-size: 1.2rem;
  line-height: 2rem;
  font-family: PingFangSC-Light;
  font-weight: 300;
  color: rgba(0, 12, 26, 1);
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  /* width: 70%; */
  width: 20rem;
}

.livingStateCon {
  position: absolute;
  top: 0;
  right: 2rem;
}
.livingState {
  line-height: 5.05rem;
}

.video-js {
  height: 100% !important;
}

.yellow {
  color: #ffdd33;
}

.orange {
  color: #ff3333;
}

.red {
  color: rgba(255, 51, 51, 1);
}

.green {
  color: #00cc29;
}
</style>
