const app = getApp();

Page({
  data: {
    settings: {
      dailyNotify: 1,
      weeklyNotify: 1,
      monthlyNotify: 1,
      notifyTime: '20:00:00',
      aiStyle: 'romantic',
      notifyTarget: 3
    }
  },

  onLoad() {
    this.loadSettings();
  },

  async loadSettings() {
    try {
      const res = await app.callCloud('user/getProfile');
      if (res.data?.user) {
        // 实际应从 notify_settings 表获取，这里简化处理
        const settings = res.data.notifySettings || this.data.settings;
        this.setData({ settings });
      }
    } catch (err) {
      console.error('Load settings error:', err);
    }
  },

  toggleDaily(e) {
    this.setData({ 'settings.dailyNotify': e.detail.value ? 1 : 0 });
  },

  toggleWeekly(e) {
    this.setData({ 'settings.weeklyNotify': e.detail.value ? 1 : 0 });
  },

  toggleMonthly(e) {
    this.setData({ 'settings.monthlyNotify': e.detail.value ? 1 : 0 });
  },

  onTimeChange(e) {
    this.setData({ 'settings.notifyTime': e.detail.value + ':00' });
  },

  setStyle(e) {
    this.setData({ 'settings.aiStyle': e.currentTarget.dataset.style });
  },

  setTarget(e) {
    this.setData({ 'settings.notifyTarget': parseInt(e.currentTarget.dataset.value) });
  },

  async save() {
    wx.showLoading({ title: '保存中...' });
    try {
      await app.callCloud('notify/updateSettings', {
        data: this.data.settings
      });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});