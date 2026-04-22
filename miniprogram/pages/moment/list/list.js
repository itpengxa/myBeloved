const app = getApp();
const { formatRelativeTime } = require('../../../utils/util');

Page({
  data: {
    moments: [],
    currentMood: '',
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.loadMoments();
  },

  onShow() {
    this.setData({ page: 1, moments: [] });
    this.loadMoments();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadMoments();
    }
  },

  async loadMoments() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await app.callCloud('moment/list', {
        page: this.data.page,
        pageSize: this.data.pageSize,
        mood: this.data.currentMood || undefined
      });

      if (res.data && res.data.list) {
        const moments = res.data.list.map(m => ({
          ...m,
          created_at: formatRelativeTime(m.created_at)
        }));

        this.setData({
          moments: this.data.page === 1 ? moments : this.data.moments.concat(moments),
          total: res.data.total,
          hasMore: this.data.moments.length + moments.length < res.data.total
        });
      }
    } catch (err) {
      console.error('Load moments error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  filterMood(e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({ currentMood: mood, page: 1, moments: [] });
    this.loadMoments();
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/moment/detail?id=${id}` });
  },

  goToEdit() {
    wx.navigateTo({ url: '/pages/moment/edit' });
  }
});
