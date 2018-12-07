<template>
  <div class="app">
    <!-- 标题  -->
    <div class="title">王者体育
      <div class="item-select fr" @click="isShowDropdown=!isShowDropdown">项目选择</div>
      <div class="select-bg" v-show="isShowDropdown" @click="isShowDropdown=!isShowDropdown">
        <div class="select-dropdown">
          <div
            class="dropdown-item"
            v-for="(item,index) in data"
            :key="index"
            :class="{active:item.liveType==currentSort.liveType}"
            @click.stop="selectSort(item)"
          >
            <i :class="item.icon"></i>
            {{item.title }}
            <span
              :class="{fr:true,red:item.liveType==currentSort.liveType}"
            >{{getLivingCount(item)}} 场</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放器 -->
    <video-player
      class="vjs-custom-skin mp4"
      v-if="videosrc"
      ref="videoPlayer"
      :options="playerOptions"
      @ready="onPlayerReadied"
      @timeupdate="onTimeupdate"
    ></video-player>
    <img class="logo" v-else :src="logoimg" alt>

    <!-- 正在直播和即将直播 -->
    <div class="type-toggle">
      <span
        class="isPlaying red"
        :class="{active:listType=='isPlaying'}"
        @click="toggleIsPlaying(0)"
      >
        正在直播
        <span class="active_line"></span>
      </span>
      <span class="line">|</span>
      <span
        class="green isNoPlaying"
        :class="{active:listType=='isNoPlaying'}"
        @click="toggleIsPlaying(1)"
      >
        即将直播
        <span class="active_line"></span>
      </span>
    </div>

    <!-- 播放列表 -->
    <!-- <swiper :options="swiperOption" class="list_box">
    <swiper-slide :key="'swiper1'">-->
    <div class="list_box">
      <div class="list_body innerbox">
        <div v-for="item in data" :key="item.liveType">
          <!-- 播放类别 -->
          <div
            class="live_name clearfix"
            @click="item.isFlod=!item.isFlod"
            :id="'liveType'+item.liveType"
          >
            <div class="fl">
              <i :class="item.icon"></i>
              {{item.title}}
            </div>
            <div class="fr">
              <span class="mlr" :class="{red:getLivingCount(item)>0}">{{getLivingCount(item)}}</span>场
              <img v-if="!item.isFlod" src="../../static/images/icon_down@2x.png" class="arrow">
              <img v-else src="../../static/images/icon_up@2x.png" class="arrow">
            </div>
          </div>
          <!-- 视频项 -->
          <div
            v-show="item.isFlod"
            v-for="live in item.list"
            :key="live.secId"
            @click="playVideo(live)"
          >
            <div
              v-show="isShowLiveOnList(live)"
              class="live_item_info"
              :class="{active:live.rtmpUrl==videosrc}"
            >
              <div class="status">
                <div class="fl">
                  <div class="leagueMatch" :class="{red:live.rtmpUrl==videosrc}">
                    {{live.leagueMatch}}&nbsp;&nbsp;&nbsp;&nbsp;
                    {{live.homeTeam}} vs {{live.visitingTeam}}
                  </div>
                  <div class="live_time clearfix" :class="{red:live.rtmpUrl==videosrc}">
                    <span
                      class="fl"
                    >{{live.exTime}} {{live.startTime|timeFromat}} - {{live.endTime|timeFromat}}</span>
                  </div>
                </div>
              </div>
              <div class="fr livingStateCon">
                <span v-if="live.rtmpUrl==videosrc" class="livingState red">播放中</span>
                <!-- <span v-else>
                  <span v-if="live.isliving" class="livingState">正在直播</span>
                  <span v-else class="livingState gray">即将直播</span>
                </span>-->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- </swiper-slide>
    </swiper>-->
  </div>
</template>

<script>
import Switcher from "@/components/Switcher";
import { md5 } from "@/../static/lib/md5.js";
import { os, Base64 } from "@/../static/lib/utils.js";
const isProduction = process.env.NODE_ENV === "production";
// console.log(process.env.NODE_ENV + "环境");
import "swiper/dist/css/swiper.css";
import { swiper, swiperSlide } from "vue-awesome-swiper";
import { typeMap } from "@/assets/js/typeMap";
// console.log(typeMap);
export default {
  name: "live",
  components: {
    Switcher,
    swiper,
    swiperSlide
  },

  data() {
    return {
      isShowDropdown: false,
      currentSort: {}, //当前赛事分类
      listType: "isPlaying", //当前选择的是播放列表/即将播放
      bs64: new Base64(),
      swiperOption: {
        direction: "vertical",
        autoHeight: true,
        freeMode: true,
        observer: true,
        observeParents: true
      },
      logoimg: "/static/images/default.png",
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
        poster:  "/static/images/default.png"
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
      this.$router.push("/");
    } else {
      this.getToken().then(()=>{this.getList();})
      document.getElementsByTagName("html")[0].style.fontSize =
        window.innerWidth / 37.5 + "px";
    }
  },

  methods: {
    onPlayerReadied() {
      if (!this.initialized) {
        this.initialized = true;
        this.currentTech = this.player.techName_;
        console.log(this.currentTech);
      }
    },
    onTimeupdate(e) {
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

    getToken(){
      return new Promise((resolve,reject)=>{
        this.loading=true
        this.$axios
              .get("/wewin-rest/auth", {
                params: { userName: "admin", password: "admin" }
              })
              .then(res => {
                this.loading=false;
                // console.log(res.data); //
                this.salt = res.data.randomKey;
                this.token=res.data.token;
                  resolve();
                }).catch((err)=>{
                  reject(err);
                })

      })
    },    
    getList() {
      this.loading = true;
          var json = JSON.stringify({ sportsType: -1, startTime: "" });
          var encode = this.bs64.encode(json);
          var md5Srt = md5(encode + this.salt);
          var Authorization = "Bearer " + this.token;

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
           var timer= setTimeout(() => {
              this.getList();
              clearTimeout(timer);
            }, 30000);
          })
        .catch(err => {
          this.loading = false;
          console.log(err);
        });
    },

    // 选择分类
    selectSort(item) {
      // if (!item.count) return;
      this.isShowDropdown = false;
      this.currentSort = item;
      $(".list_body").animate(
        { scrollTop: $("#liveType" + item.liveType)[0].offsetTop-10 + "px" },
        800
      );
    },

    //切换正在直播/即将直播
    toggleIsPlaying(type) {
      this.listType = type == 0 ? "isPlaying" : "isNoPlaying";
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
        // if(this.videosrc){
        //   var flag=false
        //    data.map((v, i) => {
        //        if(v.secId==this.currentVideo.secId){
        //          flag=true;
        //          if(this.currentVideo.m3u8Url!=v.m3u8Url){
        //            this.currentVideo.m3u8Url=v.m3u8Url;
        //          }
        //        }
        //      })
        //   if(flag==false){
        //     this.videosrc="";
        //   }
        // }
        
      data.map((v, i) => {
        this.isliving(v);
        // 没有资源则自动播放资源
        // if(!this.videosrc&&v.isliving){
        //   this.playVideo(v);
        // }
       
        list.map((vl, il) => {
          if (v.liveType == vl.liveType) {
            vl.count++;
            vl.list.push(v);
          }
        });
      });

      // 排序
      list.sort((a, b) => {
        return b.count - a.count;
      });
      this.currentSort = list[0];
      //自动播放一个视屏
      return list;
    },

    //判断是否是正在直播
    isliving(item) {
      var now = new Date();
      var begin = new Date((item.startTime || "").replace(/-/g, "/"));
      var end = new Date((item.endTime || "").replace(/-/g, "/"));
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

    //循环重刷列表
    loopRefreshList(){
          var json = JSON.stringify({ sportsType: -1, startTime: "" });
          var encode = this.bs64.encode(json);
          var md5Srt = md5(encode + this.salt);
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
          })
        .catch(err => {
          this.loading = false;
          console.log(err);
          // alert(err.message);
        });
    },

 

    // 折叠list
    flodList(item) {
      console.log(item.isFlod);
      if (item.list.length == 0) return;
      item.isFlod = !item.isFlod;
      this.$forceUpdate();
    },

    // 根据选项判断是否在列表显示
    isShowLiveOnList(live) {
      return (
        (live.isliving && this.listType == "isPlaying") ||
        (live.isliving == false && this.listType == "isNoPlaying")
      );
    },

    // 显示正在玩直播/即将直播的场次
    getLivingCount(item) {
      var flag = this.listType == "isPlaying" ? true : false;
      var count = 0;
      item.list.map((v, i) => {
        if (v.isliving == flag) {
          count++;
        }
      });
      return count;
    },

    // 点击播放直播
    playVideo(item) {
      if (!item.isliving) return alert("尚未开播");
      this.videosrc = item.rtmpUrl;
      this.currentVideo=item;
      this.playerOptions.sources[1].src = item.m3u8Url;
      this.playerOptions.sources[0].src = item.rtmpUrl;
      this.playerOptions.autoplay = true;
      this.$nextTick(()=>{
        // this.player.play()
       this.$refs.videoPlayer.player.play()
      })
    }

  }
};
</script>

<style scoped >
.app {
  vertical-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  background-color: white;
  position: relative;
  text-align: left;
  /* border-radius: 5px; */
}

/* 标题 */
.title {
  position: absolute;
  height: 4.5rem;
  line-height: 4.5rem;
  font-size: 16px;
  width: 100%;
  text-align: center;
  color: #1a2b3c;
  z-index: 2;
  background-color: #f7f7f7;
}
/* 下拉菜单 */
.item-select {
  position: absolute;
  font-size: 12px;
  margin-right: 0.4rem;
  color: #000d19;
  right: 0;
  top: 0;
  z-index: 3;
}
.select-bg {
  position: fixed;
  top: 4.5rem;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(125, 133, 139, 0.501);
  transition: all 1s;
}
.select-dropdown {
  float: right;
  width: 17.5rem;
  height: 100%;
  background-color: #fafdff;
  overflow-y: auto;
}
.dropdown-item {
padding:0 10px;
  height: 4.7rem;
  line-height: 4.7rem;
  font-size: 1.4rem;
  color: #9fa9b1;
  text-align: left;
}
.dropdown-item.active {
  background-color: #e6edf2;
  color: #3a444c;
}

/* 视屏播放器 */
.mp4 {
  position: absolute;
  top: 4.5rem;
  height: 21.1rem;
  width: 37.5rem;
  width: 100%;
  background-color: #fff;
  background: black;
  overflow: hidden;
}
.logo {
  position: absolute;
  top: 4.5rem;
  height: 21.1rem;
  width: 100%;
}

/*  正在直播和即将直播  */
.type-toggle {
  position: absolute;
  top: 25.6rem;
  height: 4.4rem;
  left: 0;
  right: 0;
  line-height: 4.4rem;
  background-color: #fafdff;
}
.isPlaying,
.isNoPlaying {
  display: inline-block;
  width: 49.5%;
  font-size: 14px;
  text-align: center;
}
.active_line {
  display: none;
}
.isPlaying.active .active_line {
  display: block;
  position: absolute;
  height: 2px;
  left: 0;
  bottom: 0px;
  width: 49.5%;
  background-color: rgba(255, 51, 51, 1);
}
.isNoPlaying.active .active_line {
  display: block;
  position: absolute;
  height: 2px;
  right: 0;
  bottom: 0px;
  width: 49.5%;
  background-color: #00cc29;
}
.line {
  color: #e9f0f5;
  width: 1%;
  position: absolute;
  margin-left: -2px;
  /* position: absolute; */
  /* margin: 0 auto; */
}

/* 播放列表 */
.list_box {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 25.6rem;
  top: 30rem;
}

.list_body {
  background-color: white;
  height: 100%;
  overflow-y: auto;
  background: rgba(230, 236, 242, 1);
  padding: 0.5rem;
}
/* 类别名称 */
.live_name {
  /* position: absolute; */
  height: 3.5rem;
  background: #fafdff;
  color: #0a2033;
  font-size: 1.4rem;
  line-height: 3.5rem;
  margin: 0.5rem 0.5rem;
  border-radius: 12px;
  padding: 0 1rem;
}
.iconfont {
  font-size: 2rem;
  /* color: #ff3333; */
  display: inline-block;
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  vertical-align: -0.6rem;
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
  /* background: rgba(247, 251, 255, 1); */
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
.live_item_info.active {
  color: rgba(255, 51, 51, 1) !important;
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
