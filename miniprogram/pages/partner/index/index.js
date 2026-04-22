const app = getApp();

Page({
  data: {
    partner: null,
    loveDays: 0,
    bindAt: ''
  },

  onShow() {
    this.loadPartnerStatus();
  },

  async loadPartnerStatus() {
    try {
      const res = await app.callCloud('partner/getStatus');
      if (res.data) {
        this.setData({
          partner: res.data.partner,
          loveDays: res.data.loveDays,
          bindAt: res.data.bindAt ? new Date(res.data.bindAt).toLocaleDateString() : ''
        });
      }
    } catch (err) {
      console.error('Load partner error:', err);
    }
  },

  goToBind() {
    wx.navigateTo({ url: '/pages/partner/bind' });
  },

  goToMoments() {
    wx.switchTab({ url: '/pages/moment/list' });
  },

  goToLetters() {
    wx.switchTab({ url: '/pages/letter/list' });
  },

  unbind() {
    wx.showModal({
      title: '确认解绑',
      content: '解绑后双方数据保留但不再互通，7天内可申请恢复。确定解绑吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.callCloud('partner/unbind');
            wx.showToast({ title: '已解绑', icon: 'success' });
            this.setData({ partner: null, loveDays: 0 });
          } catch (err) {
            wx.showToast({ title: err.message || '解绑失败', icon: 'none' });
          }
        }
      }
    });
  }
});