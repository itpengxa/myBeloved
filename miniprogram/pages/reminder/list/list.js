const app = getApp();

Page({
  data: {
    reminders: [],
    loading: false,
    typeNames: { 1: '生日', 2: '纪念日', 3: '自定义' },
    repeatNames: { 0: '不重复', 1: '每年', 2: '每月', 3: '每周' }
  },

  onLoad() {
    this.loadReminders();
  },

  onShow() {
    this.loadReminders();
  },

  async loadReminders() {
    this.setData({ loading: true });
    try {
      const res = await app.callCloud('reminder/list');
      if (res.data) {
        this.setData({ reminders: res.data });
      }
    } catch (err) {
      console.error('Load reminders error:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goToEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/reminder/edit?id=${id || ''}` });
  },

  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      await app.callCloud('reminder/update', {
        reminderId: id,
        data: { status: newStatus }
      });
      wx.showToast({ title: newStatus === 1 ? '已开启' : '已关闭', icon: 'success' });
      this.loadReminders();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  deleteReminder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定删除这个提醒吗？',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (res.confirm) {
          try {
            await app.callCloud('reminder/delete', { reminderId: id });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadReminders();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  }
});