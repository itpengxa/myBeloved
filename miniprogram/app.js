App({
  globalData: {
    userInfo: null,
    token: null,
    partnerInfo: null,
    systemInfo: null
  },

  onLaunch() {
    this.initCloud();
    this.getSystemInfo();
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.checkLoginStatus();
    }
  },

  initCloud() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'xinshangren-env',
      traceUser: true
    });
  },

  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });
  },

  async checkLoginStatus() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          type: 'getProfile',
          token: this.globalData.token
        }
      });
      if (res.result && res.result.code === 0) {
        this.globalData.userInfo = res.result.data;
      } else {
        this.logout();
      }
    } catch (err) {
      console.error('Check login failed:', err);
    }
  },

  async login() {
    try {
      const { code } = await wx.login();
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          type: 'login',
          code
        }
      });
      if (res.result && res.result.code === 0) {
        const { token, userId, isNew } = res.result.data;
        wx.setStorageSync('token', token);
        this.globalData.token = token;
        await this.checkLoginStatus();
        return { success: true, isNew };
      }
      return { success: false, message: res.result?.message || '登录失败' };
    } catch (err) {
      console.error('Login failed:', err);
      return { success: false, message: '登录失败，请重试' };
    }
  },

  async getUserProfile() {
    try {
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });
      const res = await wx.cloud.callFunction({
        name: 'user',
        data: {
          type: 'updateProfile',
          token: this.globalData.token,
          data: {
            nickname: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            gender: userInfo.gender
          }
        }
      });
      if (res.result && res.result.code === 0) {
        this.globalData.userInfo = { ...this.globalData.userInfo, ...res.result.data };
      }
      return userInfo;
    } catch (err) {
      console.error('Get user profile failed:', err);
      throw err;
    }
  },

  logout() {
    wx.removeStorageSync('token');
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.partnerInfo = null;
  },

  async callCloud(type, data = {}) {
    const token = this.globalData.token;
    if (!token && type !== 'login') {
      throw new Error('请先登录');
    }
    const res = await wx.cloud.callFunction({
      name: type.split('/')[0] || type,
      data: {
        type,
        token,
        ...data
      }
    });
    if (res.result && res.result.code !== 0) {
      throw new Error(res.result.message || '请求失败');
    }
    return res.result;
  }
});
