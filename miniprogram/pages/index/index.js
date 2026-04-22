const app = getApp();
const { formatRelativeTime } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    partnerInfo: null,
    loveDays: 0,
    moments: [],
    latestLetter: null,
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    if (app.globalData.token) {
      this.loadData();
    }
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      await this.loadUserProfile();
      await this.loadMoments();
      await this.loadLatestLetter();
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadUserProfile() {
    try {
      const res = await app.callCloud('user/getProfile');
      if (res.data) {
        this.setData({
          userInfo: res.data.user,
          partnerInfo: res.data.partner,
          loveDays: res.data.loveDays
        });
        app.globalData.userInfo = res.data.user;
        app.globalData.partnerInfo = res.data.partner;
      }
    } catch (err) {
      console.error('Load profile error:', err);
    }
  },

  async loadMoments() {
    try {
      const res = await app.callCloud('moment/list', { page: 1, pageSize: 5 });
      if (res.data && res.data.list) {
        const moments = res.data.list.map(m => ({
          ...m,
          created_at: formatRelativeTime(m.created_at)
        }));
        this.setData({ moments });
      }
    } catch (err) {
      console.error('Load moments error:', err);
    }
  },

  async loadLatestLetter() {
    try {
      const res = await app.callCloud('letter/list', { page: 1, pageSize: 1 });
      if (res.data && res.data.list && res.data.list.length > 0) {
        this.setData({ latestLetter: res.data.list[0] });
      }
    } catch (err) {
      console.error('Load letter error:', err);
    }
  },

  goToBind() {
    wx.navigateTo({ url: '/pages/partner/bind' });
  },

  goToLetterDetail() {
    const id = this.data.latestLetter?.id;
    if (id) {
      wx.navigateTo({ url: `/pages/letter/detail?id=${id}` });
    }
  },

  goToMomentEdit() {
    wx.navigateTo({ url: '/pages/moment/edit' });
  },

  goToMomentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/moment/detail?id=${id}` });
  },

  goToReminderList() {
    wx.navigateTo({ url: '/pages/reminder/list' });
  },

  goToPartner() {
    wx.navigateTo({ url: '/pages/partner/index' });
  }
});
