const app = getApp();

Page({
  data: {
    nickname: '',
    phone: '',
    gender: 0
  },

  onLoad() {
    const userInfo = app.globalData.userInfo || {};
    this.setData({
      nickname: userInfo.nickname || '',
      phone: userInfo.phone || '',
      gender: userInfo.gender || 0
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  setGender(e) {
    this.setData({ gender: parseInt(e.currentTarget.dataset.value) });
  },

  async save() {
    wx.showLoading({ title: '保存中...' });
    try {
      await app.callCloud('user/updateProfile', {
        data: {
          nickname: this.data.nickname,
          phone: this.data.phone,
          gender: this.data.gender
        }
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定清除本地缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '已清除', icon: 'success' });
        }
      }
    });
  }
});