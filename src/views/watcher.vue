<template>
  <div class="app" v-loading="loading">
    <div class="left" :class="{on_list_hide:isShowList==false}">
      <div class="live_title">
        <span>播放列表</span>
        <span>
          比赛直播中
          <span class="yellow">{{totalliving}}</span> 场
        </span>
      </div>
      <div class="list_body innerbox">
        <div v-for="item in data " :key="item.title">
          <div class="live_name" @click="flodList(item)">
            <div class="fl">{{item.title}}</div>
            <div class="fr">
              <span class="orange">{{item.list.length||0}}</span>
              <span class="mlr">场赛事</span>
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
          >
            <div class="status">
              <div class="live_time clearfix">
                <span
                  class="fl"
                >{{live.exTime}} {{live.startTime|timeFromat}} - {{live.endTime|timeFromat}}</span>
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
    <div class="right" :class="{on_list_hide:isShowList==false}">
      <div
        class="video_item"
        v-for=" item in playerList"
        :key="'videoEle'+item.secId"
        @click="playVideo(item)"
      >
        <video-player
          class="vjs-custom-skin"
          :rew="'videoEle'+item.secId"
          :ref="'videoEle'+item.secId"
          :options="item.playerOptions"
          @ready="onPlayerReadied"
          @play="onPlayerPlay"
          @timeupdate="onTimeupdate"
        >当前浏览器版本太低，不支持播放此类视频</video-player>
        <embed
          v-if="flashNoSuport"
          src="./static/media/video-js.swf"
          quality="high"
          pluginspage="http://www.macromedia.com/go/getflashplayer"
          type="application/x-shockwave-flash"
          width="100%"
          height="100%"
          style="postion:absolute"
        >
        <div class="video_details">
          <p>
            {{item.leagueMatch}}&nbsp;&nbsp;&nbsp;&nbsp;
            {{item.homeTeam}} vs {{item.visitingTeam}}
          </p>
          <p>
            {{item.exTime}} {{item.startTime|timeFromat}} - {{item.endTime|timeFromat}}
            <span
              v-if="item.isliving"
              class="mr18 fr red"
            >正在直播</span>
            <span v-else class="fr green">即将直播</span>
          </p>
        </div>
      </div>

      <img src="../../static/images/bet.png" alt="切换列表" class="list_toggle" @click="toggleShowList">
    </div>
  </div>
</template>

<script>
import Switcher from "@/components/Switcher";
import { md5 } from "@/../static/lib/md5.js";
import { os, Base64 } from "@/../static/lib/utils.js";
const isProduction = process.env.NODE_ENV === "production";
import { typeMap } from "@/assets/js/typeMap";
export default {
  name: "live",

  data() {
    return {
      loading: true,
      isShowList: true,
      loading_right: false,
      flashNoSuport: false,
      logoimg:  "/static/images/default.png",

      videosrc: "",
      data: [],

      flvPlayer: null,
      playerList: [],
      initialized: false,
      currentVideo: {},
      currentTech: "",
      isPlaying: false,
      streams: {
        rtmp: "",
        hls: ""
      },
      playerOptions: {
        overNative: true,
        fluid: true,
        controls: true,
        techOrder: ["flash"],
        autoPlay: true,
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
          }
        ],
        poster:  "/static/images/default.png"
      }
    };
  },
  computed: {
    // player() {
    //   return this.$refs.videoPlayer.player;
    // },

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
    this.checkFlash();
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
        // this.currentTech = this.player.techName_;
      }
    },

    onTimeupdate(player) {
      // console.log(player);
      // this.loading_right = false;
    },
    onPlayerPlay(player) {
      console.log(player.id());
      var playingId = player.id();
      this.isPlaying = true;
      var isAllPlaying = true;
      this.playerList.map((v, i) => {
        if (v.playerId == playingId) {
          v.isPlaying = true;
        }
        if (v.isliving && !v.isPlaying) {
          isAllPlaying = false;
        }
      });
      this.isPlaying = isAllPlaying;
    },

    getList() {
      this.loading = true;
      this.$axios
        .get("/wewin-rest/auth", {
          params: { userName: "admin", password: "admin" }
        })
        .then(res => {
          this.salt = res.data.randomKey;
          this.bs64 = new Base64();
          this.token = res.data.token;
          var json = JSON.stringify({ sportsType: -1, startTime: "" });
          var encode = this.bs64.encode(json);
          var md5Srt = md5(encode + this.salt);
          this.Authorization = "Bearer " + this.token;
          this.$axios({
            method: "post",
            url: "/wewin-rest/football/list",
            data: JSON.stringify({ object: encode, sign: md5Srt }),
            headers: {
              Authorization: this.Authorization,
              "Content-Type": "application/json"
            }
          }).then(res => {
            this.loading = false;
            this.data = this.dealData(res.data);
          });
        })
        .then(_ => {
          this.playVideo();
          var timer = setInterval(() => {
            if (this.isPlaying == false) {
              this.playVideo();
            } else {
              clearInterval(timer);
            }
          }, 3000);

          var timer2 ;
          try{
              timer2 = setInterval(() => {
              this.loop();
                }, 6000);
          }catch(e){
            clearInterval(timer2 );
            throw new Error(e)
          }

        })
        .catch(err => {
          this.loading = false;
          console.log(err);
        });
    },
    // 定时更新列表
    loop() {
      // 1.获取列表
      console.log("刷新")
      var json = JSON.stringify({ sportsType: -1, startTime: "" });
      var encode = this.bs64.encode(json);
      var md5Srt = md5(encode + this.salt);
      this.Authorization = "Bearer " + this.token;
      this.$axios({
        method: "post",
        url: "/wewin-rest/football/list",
        data: JSON.stringify({ object: encode, sign: md5Srt }),
        headers: {
          Authorization: this.Authorization,
          "Content-Type": "application/json"
        }
      })
        .then(res => {
          this.loading = false;
          // 2.判断正在播放
          // 3,将播放器中过期的干掉,新有的生成新的播放器
          this.data = this.dealFreshData(res.data);
        })

        .then(_ => {
          // 4,播放
          this.playVideo();
          var timer = setInterval(() => {
            if (this.isPlaying == false) {
              this.playVideo();
            } else {
              clearInterval(timer);
            }
          }, 3000);
        })
        .catch(err => {
          this.loading = false;
          console.log(err);
        });
    },

    // 序列化第一次请求的列表
    dealData(data) {
      var list = [];
      // 类型(0 足球,1,篮球,2,网球,3 电竞,4 羽毛球,5 乒乓球,6 排球)

      typeMap.map((v, i) => {
        list.push({
          title: v.title,
          count: 0,
          liveType: i,
          list: [],
          isFlod: true
        });
      });

      // console.log(list)
      data.map((v, i) => {
        this.isliving(v);
        v.playerOptions = JSON.parse(JSON.stringify(this.playerOptions));
        this.playerList.push(v);
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

 
 loop() {
      // 1.获取列表
      // console.log("刷新")
      var json = JSON.stringify({ sportsType: -1, startTime: "" });
      var encode = this.bs64.encode(json);
      var md5Srt = md5(encode + this.salt);
      this.Authorization = "Bearer " + this.token;
      this.$axios({
        method: "post",
        url: "/wewin-rest/football/list",
        data: JSON.stringify({ object: encode, sign: md5Srt }),
        headers: {
          Authorization: this.Authorization,
          "Content-Type": "application/json"
        }
      })
        .then(res => {
          this.loading = false;
          // 2.判断正在播放
          // 3,将播放器中过期的干掉,新有的生成新的播放器
          this.data = this.dealFreshData(res.data);
        })

        .then(_ => {
          // 4,播放
          this.playVideo();
          this.isPlaying=false;
          var timer = setInterval(() => {
              var isAllPlaying = true;
              this.playerList.map((v, i) => {
                if (v.isliving && !v.isPlaying) {
                  isAllPlaying = false;
                }
              });
              this.isPlaying = isAllPlaying;

            if (this.isPlaying == false) {
              this.playVideo();
            } else {
              clearInterval(timer);
            }
          }, 3000);
        })
        .catch(err => {
          this.loading = false;
          console.log(err);
        });
    },
    //处理刷新请求的数据
    dealFreshData(data) {
      var list = [];
 
      typeMap.map((v, i) => {
        list.push({
          title: v.title,
          count: 0,
          liveType: i,
          list: [],
          isFlod: true
        });
      });

      // 拿掉播放器列表中中不在最新列表中的播放器
      var delcount=0;
      for (var i = this.playerList.length-1; i>=0; i--) {
        var isInData = false;
        // console.log(i);
        data.map(v => {
          if (this.playerList[i].secId == v.secId) {
            isInData = true;
            //谨防播放到一半修改了播放地址；
             if(this.playerList[i].rtmpUrl != v.rtmpUrl){
                this.playerList[i].rtmpUrl = v.rtmpUrl
             }
            for (const key in v) {
              this.playerList[i][key] = v[key];
            }
          }
        });

        if (!isInData) {
          this.playerList.splice(i, 1);
          delcount++;
          i++;
        }
      }

      //把其他的放到播放列表中来

      var addcount=0;
      data.map((v, i) => {
        this.isliving(v);
        var isInPlayerList = false;
        this.playerList.map(player => {
          if (player.secId == v.secId) {
            isInPlayerList = true;
          }
        });
        if (!isInPlayerList) {
          v.playerOptions = JSON.parse(JSON.stringify(this.playerOptions));
          addcount++;
          this.playerList.push(v);
        }
        // this.playerList.push(v);
        //放到对应的分类下面
        list.map((vl, il) => {
          if (v.liveType == vl.liveType) {
            vl.count++;
            vl.list.push(v);
          }
        });
      });
       this.$notify.success({
          title: '消息',
          message: `新增${addcount}场次,过期${delcount}场次,刷新成功!`,
           position: 'bottom-right'
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
      // console.log(item.isFlod);
      if (item.list.length == 0) return;
      item.isFlod = !item.isFlod;
      this.$forceUpdate();
    },

    // 显示或隐藏列表
    toggleShowList() {
      this.isShowList = !this.isShowList;
    },

    // 点击播放直播
    playVideo(item) {
      console.log("全播");
      this.playerList.map((v, i) => {
        // console.log(v);
        if (v.isliving) {
          v.playerOptions.sources[0].src = v.rtmpUrl;
          var videoRef = "videoEle" + v.secId;
          // console.log(this.$refs[videoRef][0].player);
          v.playerId = this.$refs[videoRef][0].player.id();
          this.$refs[videoRef][0].player.play();
        }
      });

      if (item && !item.isliving)
        return this.$alert("还没有开播哦,敬请期待...");
      // this.currentVideo = item;
      // this.loading_right = true;
      // this.videosrc = item.rtmpUrl;
      // this.playerOptions.sources[0].src = item.rtmpUrl;
      // this.player.play();
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
  height: 100%;
  width: 100%;
  background-color: white;
  border-radius: 5px;
}

.left {
  float: left;
  width: 304px;
  height: 100%;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #242526;
  font-size: 14px;
  transition: all 1s;
}
.left.on_list_hide {
  margin-left: -500px;
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
  /* height: 414px; */
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
.live_item_info:hover {
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
  background-color: rgba(255, 255, 255, 0.8);
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
  position: absolute;
  top: 0;
  bottom: 0;
  left: 321px;
  right: 0;
  text-align: left;
  background-color: rgb(44, 44, 44);
  transition: all 1s;
}
.right.on_list_hide {
  left: 0px;
}
.video_item {
  width: 320px;
  background-color: #fff;
  background: black;
  display: inline-block;
  margin: 10px;
  transition: all 1s;
}
.video_details {
  background-color: rgb(80, 80, 80);
  color: rgb(172, 172, 172);
  font-size: 12px;
  padding: 4px 10px;
}
.list_toggle {
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
}
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
