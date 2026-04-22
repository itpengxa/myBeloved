const app = getApp();

Page({
  data: {
    bindMsg: '',
    bindCode: '',
    hasBindCode: false,
    inputCode: ''
  },

  onMsgInput(e) {
    this.setData({ bindMsg: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ inputCode: e.detail.value });
  },

  async generateCode() {
    wx.showLoading({ title: '生成中...' });
    try {
      const res = await app.callCloud('partner/generateCode', { bindMsg: this.data.bindMsg });
      if (res.data) {
        this.setData({
          bindCode: res.data.bindCode,
          hasBindCode: true
        });
      }
    } catch (err) {
      wx.showToast({ title: err.message || '生成失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  copyCode() {
    wx.setClipboardData({
      data: this.data.bindCode,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  shareCode() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  async bindByCode() {
    if (!this.data.inputCode || this.data.inputCode.length !== 6) {
      wx.showToast({ title: '请输入6位绑定码', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '绑定中...' });
    try {
      await app.callCloud('partner/bindByCode', { bindCode: this.data.inputCode });
      wx.showToast({ title: '绑定成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onShareAppMessage() {
    return {
      title: `${app.globalData.userInfo?.nickname || 'TA'} 邀请你绑定心上人`,
      path: '/pages/partner/bind',
      imageUrl: '/images/share.png'
    };
  }
});