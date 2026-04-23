const app = getApp();

Page({
  data: {
    userInfo: {},
    partnerInfo: null,
    loveDays: 0,
    momentCount: 0
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const res = await app.callCloud('user/getProfile');
      if (res.data) {
        this.setData({
          userInfo: res.data.user,
          partnerInfo: res.data.partner,
          loveDays: res.data.loveDays,
          momentCount: res.data.momentCount
        });
        app.globalData.userInfo = res.data.user;
        app.globalData.partnerInfo = res.data.partner;
      }
    } catch (err) {
      console.error('Load user data error:', err);
    }
  },

  async updateAvatar() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({ count: 1, mediaType: ['image'], success: resolve, fail: reject });
      });
      const tempFilePath = res.tempFiles[0].tempFilePath;
      wx.showLoading({ title: '上传中...' });

      const ossConfig = await app.callCloud('moment/getOssToken', { fileType: 'avatars' });
      const ext = tempFilePath.split('.').pop() || 'jpg';
      const key = `avatars/${app.globalData.userInfo.id}/${Date.now()}.${ext}`;

      const uploadRes = await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `https://${ossConfig.bucket}.${ossConfig.endpoint}`,
          filePath: tempFilePath,
          name: 'file',
          formData: {
            key,
            policy: ossConfig.policy,
            OSSAccessKeyId: ossConfig.accessKeyId,
            signature: ossConfig.signature,
            'x-oss-security-token': ossConfig.securityToken
          },
          success: resolve,
          fail: reject
        });
      });

      if (uploadRes.statusCode !== 200 && uploadRes.statusCode !== 204) {
        throw new Error('头像上传失败');
      }

      const avatarUrl = `https://${ossConfig.bucket}.${ossConfig.endpoint}/${key}`;
      await app.callCloud('user/updateProfile', { data: { avatarUrl } });
      this.loadData();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '上传失败', icon: 'none' });
    }
  },

  editProfile() {
    wx.navigateTo({ url: '/pages/user/settings' });
  },

  goToBind() {
    if (this.data.partnerInfo) {
      wx.navigateTo({ url: '/pages/partner/index' });
    } else {
      wx.navigateTo({ url: '/pages/partner/bind' });
    }
  },

  goToReminders() {
    wx.navigateTo({ url: '/pages/reminder/list' });
  },

  goToNotifySettings() {
    wx.navigateTo({ url: '/pages/user/notify' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/user/settings' });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  }
});