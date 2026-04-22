const app = getApp();

Page({
  data: {
    letterId: null,
    letter: null,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ letterId: options.id });
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const res = await app.callCloud('letter/detail', { letterId: this.data.letterId });
      if (res.data) {
        this.setData({ letter: res.data });
      }
    } catch (err) {
      console.error('Load letter detail error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
