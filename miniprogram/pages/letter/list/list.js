const app = getApp();

Page({
  data: {
    letters: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.loadLetters();
  },

  onShow() {
    this.setData({ page: 1, letters: [] });
    this.loadLetters();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ page: this.data.page + 1 });
      this.loadLetters();
    }
  },

  async loadLetters() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await app.callCloud('letter/list', {
        page: this.data.page,
        pageSize: this.data.pageSize
      });

      if (res.data && res.data.list) {
        this.setData({
          letters: this.data.page === 1 ? res.data.list : this.data.letters.concat(res.data.list),
          total: res.data.total,
          hasMore: this.data.letters.length + res.data.list.length < res.data.total
        });
      }
    } catch (err) {
      console.error('Load letters error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/letter/detail?id=${id}` });
  }
});
