//发送评论
async fasong() {
    //未登录提示
    if (app.userInfo.userinfo.login != true) {
        wx.showModal({
            title: '提示',
            content: '登录后才可进行此操作！是否进行授权登录？',
            showCancel: true,
            confirmText: '是',
            confirmColor: '#000000',
            cancelText: '否',
            cancelColor: '#FF4D49',
            success(res) {
                if (res.confirm) {
                    console.log('用户点击确定')
                    wx.switchTab({
                        url: "../my/wd/wd"
                    })
                    return
                } else if (res.cancel) {
                    console.log('用户点击取消')
                    return
                }
            }
        })
        return
    }
    if (app.userInfo.phone == undefined || app.userInfo.phone == null || app.userInfo.phone == "") {
        wx.showModal({
            title: '提示',
            content: '为增加网络规范，请先到设置中进行手机号码登记！我们不会泄露您的信息',
            showCancel: true,
            confirmText: '是',
            confirmColor: '#000000',
            cancelText: '否',
            cancelColor: '#000000',
            success(res) {
                if (res.confirm) {
                    //console.log('用户点击确定')
                    wx.navigateTo({
                        url: '/pages/my/set/set',
                    })
                    return
                } else if (res.cancel) {
                    //console.log('用户点击取消')
                    return
                }
            }
        })
    } else {
        //text：发送的评论内容
        var text = this.data.wbnr
        if (text.length == 0) {
            wx.showToast({
                title: '没说什么',
                icon: 'none',
                duration: 800,
            })
            return
        }

        //检测账号是否被封
        var ban = app.userInfo.ban
        if (ban == true) {
            wx.showToast({
                title: '账号被封！',
                icon: 'none',
                duration: 7000
            })
            return
        }
        console.log("是否禁言：", ban)
        //1.文本审核
        wx.showLoading({
            title: '传送中...',
            mask: true
        })
        var checkOk = await this.checkStr(text);
        //审核不通过
        if (!checkOk) {
            wx.hideLoading({}), //审核不通过隐藏
                wx.showToast({
                    title: '含有违法违规内容',
                    icon: 'none',
                    duration: 4000,
                })
            return //这个return返回，停止继续执行
        }
        wx.showLoading({
            title: '快送到了...',
            mask: true
        })
        //2.判断楼主与匿名
        var louzhu = false
        var niming = false
        //是楼主的话继承发帖状态
        if (app.userInfo._id == this.data.ss_xx.ss_xx.lzid) {
            //是楼主的话继承发帖状态
            louzhu = true
        }
        var pinglunguode = await this.fasongqian(app.userInfo._id) //更新了app中的userinfo判断是否评论过
        //console.log("获取到评论过的：",pinglunguode)
        var first = JSON.stringify(pinglunguode).includes(this.data.id)
        //判断是回复帖子，还是回复评
        //3.写其他数据并整合
        var pinglunnr = {
            liuyan: this.data.liuyan,
            title: this.data.ss_xx.title,
            photo: app.userInfo.userinfo.userphoto,
            name: app.userInfo.userinfo.username,
            time: new Date().getTime(), //发布时间
            plrid: app.userInfo._id, //评论人我的id
            wbnr: text,
            ywnr: this.data.ss_xx.ss_xx.nr,
            louzhu: louzhu,
            niming: niming,
            ssid: this.data.id,
            lzid: this.data.ss_xx.ss_xx.lzid,
            lv: 0, //表示对帖子的直接评论
            huifu: []
        }
        if (this.data.liuyan == true) {
            pinglunnr.ywnr = "【推文】" + this.data.ss_xx.title
        }
        if (pinglunnr.ywnr.length == 0) {
            pinglunnr.ywnr = '分享的' + this.data.ss_xx.ss_xx.tp.length + '张图片'
        }
        var pd = [first, "", ""] //判断用，first,__openid(被评论的),__time(被评论的)
        var riqi = utils.dateFormat(pinglunnr.time, "yyyy-MM-dd hh:mm") //发送订阅消息所用日期格式
        pinglunnr.riqi = riqi
        //楼主才有此步骤，判断匿名
        var xx = this.data.xx //原回复
        //说明点击了回复按钮
        if (xx != "") {
            //说明点击了回复按钮，此时不知回复层级
            pd[1] = xx.lv0
            pd[2] = xx.time
            var lv = xx.lv //其实被回复人lv
            pinglunnr.bhfpl = xx.wbnr //被回复的评论
            pinglunnr.bhfid = xx.id
            if (lv == 0) {
                //console.log("0")//回复lv0
                pinglunnr.lv = 1
                var index = this.data.index
                var zhankai = "ss_xx.ss_xx.huifunr[" + index + "].zhankai"
                //console.log(zhankai)
                this.setData({
                    [zhankai]: true,
                })
            } else {
                //console.log("1")//回复lv1,lv2
                pinglunnr.lv = 2
                pinglunnr.yuanname = pinglunnr.name
                pinglunnr.name = pinglunnr.name + "-》" + xx.name
            }
        }

        this.fbpl(pinglunnr, pd) //云函数上传发表
        wx.hideLoading({})
        //评论成功
        wx.showToast({
            title: '评论成功',
            icon: 'none',
            duration: 1000,
        })
        var huifunr = this.data.ss_xx.ss_xx.huifunr
        //这里本地进行判断
        app.ssinfo.plnb++
        console.log(app.ssinfo.plnb)
        var xx = this.data.ss_xx
        xx.ss_xx.huifunb = app.ssinfo.plnb
        this.setData({
            ss_xx: xx
        })
        if (pd[1] != "") {
            //这是回复别人
            var index = this.data.index
            huifunr[index].huifu.push(pinglunnr)
            huifunr[index].huifunb++
        } else {
            huifunr.push(pinglunnr)
        }

        this.setData({
            "ss_xx.ss_xx.huifunr": huifunr,
            wbnr: "",
            xx: "",
            input: "留下你的精彩评论吧",
        })
        //console.log(this.data.ss_xx)
    }

},