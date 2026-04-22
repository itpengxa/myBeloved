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
      const { tempFiles } = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
      wx.showLoading({ title: '上传中...' });
      // 简化处理，实际应上传至OSS
      await app.callCloud('user/updateProfile', {
        data: { avatarUrl: tempFiles[0].tempFilePath }
      });
      this.loadData();
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
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