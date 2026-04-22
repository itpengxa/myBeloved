const app = getApp();
const { formatRelativeTime } = require('../../../utils/util');

Page({
  data: {
    momentId: null,
    moment: null,
    loading: false,
    isOwner: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ momentId: options.id });
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const res = await app.callCloud('moment/detail', { momentId: this.data.momentId });
      if (res.data) {
        const moment = {
          ...res.data,
          created_at: formatRelativeTime(res.data.created_at),
          comments: (res.data.comments || []).map(c => ({
            ...c,
            created_at: formatRelativeTime(c.created_at)
          }))
        };
        this.setData({
          moment,
          isOwner: app.globalData.userInfo && app.globalData.userInfo.id === moment.user_id
        });
      }
    } catch (err) {
      console.error('Load detail error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.moment.images
    });
  },

  deleteMoment() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.callCloud('moment/delete', { momentId: this.data.momentId });
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
