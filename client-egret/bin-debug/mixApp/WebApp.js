var MixApp;
(function (MixApp) {
    var WebApp = (function () {
        function WebApp() {
        }
        var d = __define,c=WebApp,p=c.prototype;
        p.getUrlFieldWord = function (field) {
            //获取全部地址
            var index;
            var url = window.location.search;
            url = url.slice(1);
            //去掉#后面部分
            index = url.indexOf("#");
            if (index > -1) {
                url = url.slice(0, index);
            }
            //以&符号做分割处理
            var arr = url.split("&");
            //查询数组内是否存在需要的field
            for (var i = 0; i < arr.length; i++) {
                index = arr[i].indexOf(field);
                if (index > -1) {
                    return arr[i].slice(index + field.length + 1);
                }
            }
            //都没有返回空字符
            return "";
        };
        p.checkUrl = function () {
            if (MixApp.WebAppConfig.LocalTest) {
                MixApp.AppMain.initLogin();
                return;
            }
            //检查url中是否带有state和openid
            //以此判断用户是否通过微信登录
            var url = window.location.href;
            var index = url.indexOf("?");
            //有传递的参数code
            if (this.getUrlFieldWord("code") !== "") {
                console.log("已经认证加载并初始化js-sdk");
                MixApp.UserConfig.code = this.getUrlFieldWord("code");
                this.getWxJsSdkSign();
                this.loadAppRes();
            }
            else {
                console.log("没有code执行认证");
                this.wxAuthToken();
            }
        };
        //微信认证登录
        p.wxAuthToken = function () {
            //跳转到微信认证页面 请求登录
            console.log("跳转页面 请求微信认证");
            var url = "https://open.weixin.qq.com/connect/oauth2/authorize";
            url += "?appid=" + MixApp.WxConfig.AppId;
            var callBackUrl = window.location.href;
            var index = callBackUrl.indexOf("?");
            if (index > -1) {
                callBackUrl = callBackUrl.slice(0, index);
            }
            // console.log(callBackUrl);
            url += "&redirect_uri=" + encodeURIComponent(callBackUrl);
            url += "&response_type=code";
            url += "&scope=snsapi_userinfo";
            url += "&state=" + MixApp.WxConfig.CallBackStateStr;
            url += "#wechat_redirect";
            //打开微信认证网页
            window.location.href = url;
        };
        p.getWxJsSdkSign = function () {
            console.log("微信js-sdk开始初始化");
            var jsonUrl = MixApp.WxConfig.JsSdkSignUrl + "?";
            jsonUrl += "url=" + encodeURIComponent(window.location.href);
            //1 请求自己的php服务器获取签名
            var request = new egret.HttpRequest();
            request.responseType = egret.HttpResponseType.TEXT;
            request.open(jsonUrl, egret.HttpMethod.GET);
            request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            request.send();
            request.addEventListener(egret.Event.COMPLETE, this.onGetJsSdkSignComplete, this);
        };
        p.onGetJsSdkSignComplete = function (event) {
            var request = event.currentTarget;
            console.log("get data : ", request.response);
            var data = JSON.parse(request.response);
            //2 微信js-sdk初始化 成功后做标记
            var config = new BodyConfig();
            config.debug = MixApp.WxConfig.JsSdkIsOpenDebug;
            config.appId = MixApp.WxConfig.AppId;
            config.timestamp = data.timestamp;
            config.nonceStr = data.noncestr;
            config.signature = data.signature;
            config.jsApiList = MixApp.WxConfig.JsApiList;
            wx.config(config);
            //3 成功后 执行login
            var that = this;
            wx.ready(function (res) {
                if (res.errMsg === "config:ok") {
                    that.wxJsSdkComplete();
                }
            });
        };
        //微信js-sdk初始完成
        p.wxJsSdkComplete = function () {
            console.log("微信js-sdk初始成功");
            this.isGetWxJsSdkSign = true;
            this.login();
        };
        p.loadAppRes = function () {
            //1 设置监听器
            RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.loadAppResComplete, this);
            //2 加载需要的资源组
            RES.loadGroup("app");
            console.log("开始加载app资源组");
        };
        //app所需资源加载完成
        p.loadAppResComplete = function (event) {
            if (event.groupName === "app") {
                console.log("app资源加载成功");
                //1 加载完成 做标记
                this.isLoadAppRes = true;
                //2 移除监听器
                RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.loadAppResComplete, this);
                //3 执行login
                this.login();
            }
        };
        /*
        待js-sdk初始化 并 资源加载完毕后 登录app
        */
        p.login = function () {
            //判断 js-sdk与资源加载是否都已经完成
            //完成则进入app页面
            if (this.isLoadAppRes && this.isGetWxJsSdkSign) {
                console.log("登录app");
                //todo
                MixApp.AppMain.initLogin();
            }
        };
        return WebApp;
    })();
    MixApp.WebApp = WebApp;
    egret.registerClass(WebApp,'MixApp.WebApp');
})(MixApp || (MixApp = {}));